use axum::{
  Json, Router,
  extract::{Path, State},
  http::HeaderMap,
  routing::{delete, post},
};
use serde::{Deserialize, Serialize};

use crate::{
  app::api::{ApiError, ApiState, require_admin},
  types::Team,
};

/// The diagram's TeamDto: what a client sends when creating a team.
#[derive(Deserialize)]
pub struct TeamDto {
  pub name: String,
  pub description: String,
}

#[derive(Deserialize)]
pub struct AddMemberDto {
  pub user_id: u128,
}

/// API response shape: u128 ids go out as strings because JavaScript numbers
/// (2^53) silently round them; the frontend contract uses string ids everywhere.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct TeamResponse {
  id: String,
  name: String,
  description: String,
  owner_id: String,
  created_at: String,
}

impl From<Team> for TeamResponse {
  fn from(t: Team) -> Self {
    Self {
      id: t.id.to_string(),
      name: t.name,
      description: t.description,
      owner_id: t.owner_id.to_string(),
      created_at: t.created_at.to_rfc3339(),
    }
  }
}

pub fn make_router() -> Router<ApiState> {
  Router::new()
    .route("/", post(handle_create_team).get(handle_get_teams))
    .route("/{id}", delete(handle_delete_team))
    .route("/{id}/members", post(handle_add_member))
}

async fn handle_create_team(
  State(state): State<ApiState>,
  headers: HeaderMap,
  Json(dto): Json<TeamDto>,
) -> Result<Json<TeamResponse>, ApiError> {
  let requester = require_admin(&state, &headers)?;
  state
    .team_service
    .create_team(&dto.name, &dto.description, &requester)
    .map(|team| Json(TeamResponse::from(team)))
    .map_err(|e| ApiError::BadRequest(e.into()))
}

async fn handle_get_teams(
  State(state): State<ApiState>,
  headers: HeaderMap,
) -> Result<Json<Vec<TeamResponse>>, ApiError> {
  let requester = require_admin(&state, &headers)?;
  Ok(Json(
    state.team_service.get_all_teams(&requester).into_iter().map(TeamResponse::from).collect(),
  ))
}

async fn handle_delete_team(
  State(state): State<ApiState>,
  headers: HeaderMap,
  Path(id): Path<String>,
) -> Result<Json<TeamResponse>, ApiError> {
  let requester = require_admin(&state, &headers)?;
  let id: u128 = id.parse().map_err(|_| ApiError::BadRequest("invalid team id".into()))?;
  if state.team_service.get_team_by_id(id).is_none() {
    return Err(ApiError::NotFound);
  }
  state
    .team_service
    .delete_team(id, &requester)
    .map(|team| Json(TeamResponse::from(team)))
    .map_err(|e| ApiError::BadRequest(e.into()))
}

/// Beyond the diagram's TeamAPI, which only exposes the three routes above; the
/// frontend will need this once it consumes team CRUD.
async fn handle_add_member(
  State(state): State<ApiState>,
  headers: HeaderMap,
  Path(id): Path<String>,
  Json(dto): Json<AddMemberDto>,
) -> Result<Json<TeamResponse>, ApiError> {
  let requester = require_admin(&state, &headers)?;
  let id: u128 = id.parse().map_err(|_| ApiError::BadRequest("invalid team id".into()))?;
  if state.team_service.get_team_by_id(id).is_none() {
    return Err(ApiError::NotFound);
  }
  state
    .team_service
    .add_member(id, dto.user_id, &requester)
    .map(|team| Json(TeamResponse::from(team)))
    .map_err(|e| ApiError::BadRequest(e.into()))
}
