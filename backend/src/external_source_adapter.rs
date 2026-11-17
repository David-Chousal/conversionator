use chrono::{DateTime, Utc};
use serde::Serialize;

/// Sync health for one source, as the /sources API reports it.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalSourceStatus {
  pub last_synced_at: Option<DateTime<Utc>>,
  pub cached_at: Option<DateTime<Utc>>,
  pub cache_expired: bool,
}

mod simple_api_adapter;
pub use simple_api_adapter::SimpleApiAdapter;
