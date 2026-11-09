use std::sync::Arc;

use axum::{
  Json, Router, extract::State, handler::Handler,
  response::IntoResponse, routing::post,
};

use crate::{
  app::api::auth_service::{AuthServiceApi, LoginError},
  auth_service::AuthService,
  token_service::TokenService,
};

pub mod auth_service;

pub trait TeamServiceApi {}

#[derive(Clone)]
pub struct ApiState {
  pub auth_service: Arc<dyn AuthService<u128> + Send + Sync>,
  pub token_service: Arc<dyn TokenService + Send + Sync>,
}

pub struct CorApi {
  state: ApiState,
  router: Router<ApiState>,
}

impl CorApi {
  pub fn new(
    auth_service: Arc<dyn AuthService<u128> + Send + Sync>,
    token_service: Arc<dyn TokenService + Send + Sync>,
  ) -> Self {
    Self {
      state: ApiState {
        auth_service,
        token_service,
      },
      router: Router::<ApiState>::new(),
    }
  }

  fn setup_routes(&self, router: Router<ApiState>) -> Router {
    // TODO extract this to a config file and a reader
    router
      .route("/auth/login", post(Self::handle_login))
      .with_state(self.state.clone()) // just a couple pointers dont fuss
  }

  async fn handle_login(
    state: State<self::ApiState>,
    params: Json<auth_service::LoginParams>,
  ) -> impl IntoResponse {
    Self::login(state, params).await
  }
}

impl AuthServiceApi for CorApi {
  async fn login(
    State(state): State<self::ApiState>,
    Json(params): Json<auth_service::LoginParams>,
  ) -> Result<String, auth_service::LoginError> {
    state
      .auth_service
      .login(params.username, params.password_hash)
      .map_err(|_| LoginError::InvalidCredentials) // TODO fix this and logout to propogate errors upwards correctly
  }

  async fn logout(
    State(state): State<self::ApiState>,
    Json(params): Json<auth_service::LogoutParams>,
  ) -> Result<(), auth_service::LogoutError> {
    state
      .auth_service
      .logout(&params.token)
      .map_err(|_| auth_service::LogoutError::InvalidToken)
  }
}

impl TeamServiceApi for CorApi {}
