use std::{net::SocketAddr, sync::Arc};

use axum::{
  Json, Router,
  extract::State,
  response::IntoResponse,
  routing::{get, post},
};
use hyper::{body::Incoming, server::conn::http1};
use hyper_util::rt::TokioIo;
use tower::Service as _;

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
      router: Self::setup_routes(),
    }
  }

  /// defines api routes and respective handlers
  fn setup_routes() -> Router<ApiState> {
    // TODO extract this logic to a config file and a reader

    let auth_router = Router::new()
      .route("/login", post(Self::handle_login))
      .route("/logout", post(Self::handle_logout));

    let foo_router =
      Router::new().route("/", get(async || "Hello world!"));

    Router::new()
      .nest("/auth", auth_router)
      .nest("/foo", foo_router)
  }

  pub async fn serve(
    &self,
    sockaddr: SocketAddr,
  ) -> Result<(), tokio::io::Error> {
    let listener = tokio::net::TcpListener::bind(sockaddr).await?;
    loop {
      let (stream, addr) = listener.accept().await?;
      let io = TokioIo::new(stream);
      let tower_service = self
        .router
        .clone()
        .with_state(self.state.clone())
        .into_service();

      tokio::task::spawn(async move {
        let hyper_service = hyper::service::service_fn(
          move |req: hyper::Request<Incoming>| {
            tower_service.clone().call(req)
          },
        );

        if let Err(e) = http1::Builder::new()
          .serve_connection(io, hyper_service)
          .await
        {
          eprintln!("Error serving connection from {addr}: {e}");
        }
      });
    }
  }

  async fn handle_login(
    state: State<self::ApiState>,
    params: Json<auth_service::LoginParams>,
  ) -> impl IntoResponse {
    Self::login(state, params).await
  }

  async fn handle_logout(
    state: State<ApiState>,
    params: Json<auth_service::LogoutParams>,
  ) -> impl IntoResponse {
    Self::logout(state, params).await
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
