use axum::{
  Json, body::Body, extract::State, http::Response,
  response::IntoResponse,
};

use crate::app::api;

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

pub trait AuthServiceApi {
  /// takes login credentials and returns token or error
  async fn login(
    state: State<api::ApiState>,
    params_json: Json<LoginParams>,
  ) -> Result<String, LoginError>;

  /// takes token and logs out user, or returns error
  async fn logout(
    state: State<api::ApiState>,
    params_json: Json<LogoutParams>,
  ) -> Result<(), LogoutError>;
}
