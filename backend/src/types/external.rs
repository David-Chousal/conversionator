use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A configured external data source (the class diagram's ExternalDataSource).
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceConfig {
  pub id: u128,
  pub name: String,
  pub platform: String,
  pub url: String,
  pub api_key: String,
  pub sync_interval_seconds: u64,
  pub last_synced_at: Option<DateTime<Utc>>,
}

/// Cached external payload (the diagram's ExternalDataCache).
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalDataCache {
  pub source_id: u128,
  pub data: String,
  pub cached_at: DateTime<Utc>,
  pub expires_at: DateTime<Utc>,
}

impl ExternalDataCache {
  pub fn is_expired(&self) -> bool {
    self.expires_at < Utc::now()
  }
}

/// One day of one campaign's ad metrics, as the external API reports them.
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExternalMetricRow {
  pub date: String,
  pub campaign_id: String,
  pub campaign: String,
  pub spend_cents: u64,
  pub clicks: u64,
  pub engagements: u64,
  pub impressions: u64,
  pub conversions: u64,
}

/// The external API's payload shape: `{"data": [...]}`.
#[derive(Clone, Serialize, Deserialize)]
pub struct MetricsPayload {
  pub data: Vec<ExternalMetricRow>,
}
