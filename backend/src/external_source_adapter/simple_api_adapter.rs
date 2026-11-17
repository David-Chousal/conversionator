use std::sync::Arc;

use chrono::{Duration, Utc};

use crate::{
  database::ExternalDataCacheRepository,
  external_source_adapter::ExternalSourceStatus,
  types::{ExternalDataCache, MetricsPayload, SourceConfig},
};

/// The diagram's ExternalSourceAdapter, for the demo's JSON metrics API:
/// fetches fresh rows, validates them, and caches the payload until the next
/// sync is due. Orchestration (when to sync, stamping last_synced_at) lives
/// with the caller — the scheduler and the /sources API.
pub struct SimpleApiAdapter {
  config: SourceConfig,
  cache: Arc<dyn ExternalDataCacheRepository>,
}

impl SimpleApiAdapter {
  pub fn new(config: SourceConfig, cache: Arc<dyn ExternalDataCacheRepository>) -> Self {
    Self { config, cache }
  }

  pub fn config(&self) -> &SourceConfig {
    &self.config
  }

  /// The diagram's isSyncDue: never-synced sources are always due.
  pub fn sync_due(&self) -> bool {
    match self.config.last_synced_at {
      None => true,
      Some(at) => {
        Utc::now() - at >= Duration::seconds(self.config.sync_interval_seconds as i64)
      }
    }
  }

  /// Fetches fresh rows and caches them; returns the row count.
  pub async fn sync(&self) -> Result<usize, &'static str> {
    let client = reqwest::Client::new();
    let res = client
      .get(&self.config.url)
      .bearer_auth(&self.config.api_key)
      .timeout(std::time::Duration::from_secs(10))
      .send()
      .await
      .map_err(|_| "error fetching remote url")?;
    if !res.status().is_success() {
      return Err("external api returned an error");
    }
    let payload: MetricsPayload = res
      .json()
      .await
      .map_err(|_| "unexpected payload from external api")?;
    let rows = payload.data.len();
    let data = serde_json::to_string(&payload).map_err(|_| "could not encode payload")?;
    let now = Utc::now();
    let expires = now + Duration::seconds(self.config.sync_interval_seconds as i64);
    self.cache.save_cache(&ExternalDataCache {
      source_id: self.config.id,
      data,
      cached_at: now,
      expires_at: expires,
    });
    Ok(rows)
  }

  pub fn status(&self) -> ExternalSourceStatus {
    match self.cache.get_cache(self.config.id) {
      Some(cache) => ExternalSourceStatus {
        last_synced_at: Some(cache.cached_at),
        cached_at: Some(cache.cached_at),
        cache_expired: cache.is_expired(),
      },
      None => ExternalSourceStatus {
        last_synced_at: None,
        cached_at: None,
        cache_expired: true,
      },
    }
  }

  /// The diagram's getCachedData: the cached rows, if any.
  pub fn cached_rows(&self) -> Option<MetricsPayload> {
    let cache = self.cache.get_cache(self.config.id)?;
    serde_json::from_str(&cache.data).ok()
  }
}

#[cfg(test)]
mod tests {
  use std::sync::Arc;

  use chrono::{DateTime, Utc};

  use crate::database::SimpleDatabase;

  use super::*;

  fn adapter(last_synced_at: Option<DateTime<Utc>>) -> SimpleApiAdapter {
    SimpleApiAdapter::new(
      SourceConfig {
        id: 1,
        name: "demo".into(),
        platform: "google-ads".into(),
        url: "http://127.0.0.1:4001/v1/metrics".into(),
        api_key: "demo-source-key".into(),
        sync_interval_seconds: 300,
        last_synced_at,
      },
      Arc::new(SimpleDatabase::new()),
    )
  }

  #[test]
  fn never_synced_is_due() {
    assert!(adapter(None).sync_due());
  }

  #[test]
  fn fresh_sync_is_not_due() {
    assert!(!adapter(Some(Utc::now())).sync_due());
  }

  #[test]
  fn stale_sync_is_due() {
    let stale = Utc::now() - Duration::seconds(301);
    assert!(adapter(Some(stale)).sync_due());
  }

  #[test]
  fn no_cache_means_expired_status() {
    let adapter = adapter(None);
    let status = adapter.status();
    assert!(status.cache_expired);
    assert!(status.last_synced_at.is_none());
    assert!(adapter.cached_rows().is_none());
  }
}
