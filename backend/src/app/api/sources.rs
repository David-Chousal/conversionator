use axum::{
  Json, Router,
  extract::{Path, State},
  http::HeaderMap,
  routing::{delete, get, post},
};
use chrono::Utc;
use serde::{Deserialize, Serialize};

use crate::{
  app::api::{ApiError, ApiState, require_admin, require_user},
  external_source_adapter::{ExternalSourceStatus, SimpleApiAdapter},
  types::{ExternalMetricRow, SourceConfig},
};

/// Canned source config for the demo: every ad platform points at the demo ads
/// API. Override with COR_DEMO_API_URL / COR_DEMO_API_KEY for the hosted API.
fn demo_source_config(platform: &str) -> Option<SourceConfig> {
  const PLATFORMS: [&str; 5] = ["google-ads", "meta-ads", "linkedin-ads", "tiktok-ads", "microsoft-ads"];
  if !PLATFORMS.contains(&platform) {
    return None;
  }
  Some(SourceConfig {
    id: uuid::Uuid::new_v4().as_u128(),
    name: format!("{platform} (demo)"),
    platform: platform.to_string(),
    url: std::env::var("COR_DEMO_API_URL")
      .unwrap_or_else(|_| "http://127.0.0.1:4001/v1/metrics".into()),
    api_key: std::env::var("COR_DEMO_API_KEY").unwrap_or_else(|_| "demo-source-key".into()),
    sync_interval_seconds: 300,
    last_synced_at: None,
  })
}

/// Response shape matching the frontend's Connection mapping (string ids; JS
/// numbers round u128s).
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SourceResponse {
  id: String,
  platform: String,
  name: String,
  status: String,
  last_synced_at: Option<String>,
  sync_interval_seconds: u64,
  next_sync_at: Option<String>,
}

fn status_string(config: &SourceConfig, status: &ExternalSourceStatus) -> String {
  if status.last_synced_at.is_some() && !status.cache_expired {
    "connected".into()
  } else if status.last_synced_at.is_some() || config.last_synced_at.is_some() {
    "failed".into()
  } else {
    "available".into()
  }
}

fn response(config: SourceConfig, status: ExternalSourceStatus) -> SourceResponse {
  let status = status_string(&config, &status);
  let next_sync_at = config
    .last_synced_at
    .map(|at| (at + chrono::Duration::seconds(config.sync_interval_seconds as i64)).to_rfc3339());
  SourceResponse {
    id: config.id.to_string(),
    platform: config.platform,
    name: config.name,
    status,
    last_synced_at: config.last_synced_at.map(|at| at.to_rfc3339()),
    sync_interval_seconds: config.sync_interval_seconds,
    next_sync_at,
  }
}

fn adapter_for(state: &ApiState, config: SourceConfig) -> SimpleApiAdapter {
  SimpleApiAdapter::new(config, state.cache_repository.clone())
}

#[derive(Deserialize)]
pub struct ConnectDto {
  pub platform: String,
}

async fn handle_list_sources(
  State(state): State<ApiState>,
  headers: HeaderMap,
) -> Result<Json<Vec<SourceResponse>>, ApiError> {
  let _user = require_user(&state, &headers)?; // any signed-in user can browse connections
  Ok(Json(
    state
      .source_repository
      .get_all()
      .into_iter()
      .map(|config| {
        let status = adapter_for(&state, config.clone()).status();
        response(config, status)
      })
      .collect(),
  ))
}

async fn handle_connect_source(
  State(state): State<ApiState>,
  headers: HeaderMap,
  Json(dto): Json<ConnectDto>,
) -> Result<Json<SourceResponse>, ApiError> {
  let _requester = require_admin(&state, &headers)?;
  let config = demo_source_config(&dto.platform)
    .ok_or_else(|| ApiError::BadRequest(format!("unknown platform \"{}\"", dto.platform)))?;
  state.source_repository.save(&config);
  let status = adapter_for(&state, config.clone()).status();
  Ok(Json(response(config, status)))
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SyncResponse {
  rows: usize,
  finished_at: String,
}

/// The frontend's SyncResult: { rows, finishedAt }.
async fn handle_sync(
  State(state): State<ApiState>,
  headers: HeaderMap,
  Path(id): Path<String>,
) -> Result<Json<SyncResponse>, ApiError> {
  let _requester = require_admin(&state, &headers)?;
  let id: u128 = id.parse().map_err(|_| ApiError::BadRequest("invalid source id".into()))?;
  let config = state
    .source_repository
    .get_by_id(id)
    .ok_or(ApiError::NotFound)?;
  let rows = adapter_for(&state, config.clone())
    .sync()
    .await
    .map_err(|e| ApiError::BadRequest(e.into()))?;
  let finished_at = Utc::now();
  let mut updated = config;
  updated.last_synced_at = Some(finished_at);
  state.source_repository.save(&updated);
  Ok(Json(SyncResponse {
    rows,
    finished_at: finished_at.to_rfc3339(),
  }))
}

/// Beyond the diagram's API surface; resets the connection to healthy.
async fn handle_reconnect(
  State(state): State<ApiState>,
  headers: HeaderMap,
  Path(id): Path<String>,
) -> Result<Json<SourceResponse>, ApiError> {
  let _requester = require_admin(&state, &headers)?;
  let id: u128 = id.parse().map_err(|_| ApiError::BadRequest("invalid source id".into()))?;
  let config = state
    .source_repository
    .get_by_id(id)
    .ok_or(ApiError::NotFound)?;
  let status = adapter_for(&state, config.clone()).status();
  Ok(Json(response(config, status)))
}

/// Disconnect removes the config and the data COR stored from the source.
async fn handle_delete_source(
  State(state): State<ApiState>,
  headers: HeaderMap,
  Path(id): Path<String>,
) -> Result<(), ApiError> {
  let _requester = require_admin(&state, &headers)?;
  let id: u128 = id.parse().map_err(|_| ApiError::BadRequest("invalid source id".into()))?;
  if state.source_repository.delete_by_id(id).is_none() {
    return Err(ApiError::NotFound);
  }
  state.cache_repository.delete_cache(id);
  Ok(())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MetricsSource {
  id: String,
  platform: String,
  name: String,
  data: Vec<ExternalMetricRow>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct MetricsResponse {
  sources: Vec<MetricsSource>,
}

/// The cached advertising data itself, per source; what the dashboards consume.
async fn handle_metrics(
  State(state): State<ApiState>,
  headers: HeaderMap,
) -> Result<Json<MetricsResponse>, ApiError> {
  let _user = require_user(&state, &headers)?;
  let sources = state
    .source_repository
    .get_all()
    .into_iter()
    .map(|config| {
      let adapter = adapter_for(&state, config.clone());
      MetricsSource {
        id: config.id.to_string(),
        platform: config.platform,
        name: config.name,
        data: adapter.cached_rows().map(|p| p.data).unwrap_or_default(),
      }
    })
    .collect();
  Ok(Json(MetricsResponse { sources }))
}

pub fn make_sources_router() -> Router<ApiState> {
  Router::new()
    .route("/", get(handle_list_sources).post(handle_connect_source))
    .route("/{id}/sync", post(handle_sync))
    .route("/{id}/reconnect", post(handle_reconnect))
    .route("/{id}", delete(handle_delete_source))
}

pub fn make_metrics_router() -> Router<ApiState> {
  Router::new().route("/", get(handle_metrics))
}
