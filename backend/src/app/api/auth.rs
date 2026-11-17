use axum::{
  Json, Router, body::Body, extract::State, http::{HeaderMap, Response},
  response::IntoResponse, routing::{get, post},
};

use crate::app::api::{ApiError, ApiState, require_user};

#[derive(serde::Deserialize)]
pub struct LoginParams {
  pub username: String,
  /// Plain password; the backend hashes (bcrypt) and verifies server-side.
  pub password: String,
}

#[derive(Debug)]
#[non_exhaustive]
pub enum LoginError {
  InvalidCredentials,
}

impl IntoResponse for LoginError {
  fn into_response(self) -> axum::response::Response {
    Response::builder()
      .status(401)
      .body(Body::from("Login error"))
      .unwrap()
  }
}

#[derive(serde::Deserialize)]
pub struct LogoutParams {
  pub token: String,
}

#[non_exhaustive]
pub enum LogoutError {
  InvalidToken,
}

impl IntoResponse for LogoutError {
  fn into_response(self) -> axum::response::Response {
    Response::builder()
      .status(401)
      .body(Body::from("Logout error"))
      .unwrap()
  }
}

pub fn make_router() -> Router<ApiState> {
  Router::new()
    .route("/login", post(handle_login))
    .route("/logout", post(handle_logout))
}

/// The signed-in user, mounted at the root as GET /me.
pub fn make_me_router() -> Router<ApiState> {
  Router::new().route("/", get(handle_me))
}

/// Response shape: string id (JS numbers round u128s), no password hash,
/// role as "admin" | "user" to match the frontend contract.
#[derive(serde::Serialize)]
struct UserResponse {
  id: String,
  username: String,
  email: String,
  role: String,
}

impl From<crate::types::User> for UserResponse {
  fn from(u: crate::types::User) -> Self {
    Self {
      id: u.id.to_string(),
      username: u.username,
      email: u.email,
      role: match u.role {
        crate::types::UserRole::Admin => "admin".into(),
        crate::types::UserRole::User => "user".into(),
      },
    }
  }
}

async fn handle_me(
  State(state): State<ApiState>,
  headers: HeaderMap,
) -> Result<Json<UserResponse>, ApiError> {
  let user = require_user(&state, &headers)?;
  Ok(Json(UserResponse::from(user)))
}

async fn handle_login(
  State(state): State<ApiState>,
  Json(params): Json<LoginParams>,
) -> impl IntoResponse {
  state
    .auth_service
    .login(params.username, &params.password)
    .map_err(|_| LoginError::InvalidCredentials) // TODO fix this and logout to propogate errors upwards correctly
}

async fn handle_logout(
  State(state): State<self::ApiState>,
  Json(params): Json<LogoutParams>,
) -> Result<(), LogoutError> {
  state
    .auth_service
    .logout(&params.token)
    .map_err(|_| LogoutError::InvalidToken)
}
