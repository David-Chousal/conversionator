use axum::{
  Json, Router, body::Body, extract::State, http::Response,
  response::IntoResponse, routing::post,
};

use crate::app::api::ApiState;

#[derive(serde::Deserialize)]
pub struct LoginParams {
  pub username: String,
  pub password_hash: u128,
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

async fn handle_login(
  State(state): State<ApiState>,
  Json(params): Json<LoginParams>,
) -> impl IntoResponse {
  state
    .auth_service
    .login(params.username, params.password_hash)
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
