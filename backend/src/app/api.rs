use std::sync::Arc;

use axum::{Router, body::Body, http::{self, HeaderMap, StatusCode}, response::{IntoResponse, Response}, routing::get};
use hyper::{body::Incoming, server::conn::http1};
use hyper_util::rt::TokioIo;
use tower::Service as _;

use crate::{
  auth_service::AuthService,
  database::UserRepository,
  role_check::require_role,
  team_service::TeamService,
  token_service::TokenService,
  types::{User, UserRole},
};

pub mod auth;
pub mod team;

#[derive(Clone)]
pub struct ApiState {
  pub auth_service: Arc<dyn AuthService + Send + Sync>,
  pub token_service: Arc<dyn TokenService + Send + Sync>,
  pub user_repository: Arc<dyn UserRepository + Send + Sync>,
  pub team_service: Arc<dyn TeamService + Send + Sync>,
}

pub struct CorApi {
  state: ApiState,
  router: Router<ApiState>,
}

/// Shared API error with proper status codes (unlike the auth routes' blanket 401).
#[derive(Debug)]
pub enum ApiError {
  Unauthorized,
  Forbidden,
  NotFound,
  BadRequest(String),
}

impl IntoResponse for ApiError {
  fn into_response(self) -> Response {
    let (status, message) = match self {
      ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "Sign in again".to_string()),
      ApiError::Forbidden => (StatusCode::FORBIDDEN, "Admins only".to_string()),
      ApiError::NotFound => (StatusCode::NOT_FOUND, "Not found".to_string()),
      ApiError::BadRequest(message) => (StatusCode::BAD_REQUEST, message),
    };
    Response::builder()
      .status(status)
      .body(Body::from(message))
      .unwrap()
  }
}

/// Resolves the requester from the `Authorization: Bearer <token>` header.
pub fn require_user(state: &ApiState, headers: &HeaderMap) -> Result<User, ApiError> {
  let header = headers
    .get(http::header::AUTHORIZATION)
    .and_then(|v| v.to_str().ok())
    .unwrap_or("");
  let token = header.strip_prefix("Bearer ").map(str::trim).unwrap_or("");
  let token = state.token_service.get_token(token).ok_or(ApiError::Unauthorized)?;
  if token.is_expired() {
    return Err(ApiError::Unauthorized);
  }
  state
    .user_repository
    .get_by_id(token.user_id)
    .ok_or(ApiError::Unauthorized)
}

/// Like require_user, but the requester must be an admin.
pub fn require_admin(state: &ApiState, headers: &HeaderMap) -> Result<User, ApiError> {
  let user = require_user(state, headers)?;
  require_role(&user, UserRole::Admin).map_err(|_| ApiError::Forbidden)?;
  Ok(user)
}

impl CorApi {
  pub fn new(
    auth_service: Arc<dyn AuthService + Send + Sync>,
    token_service: Arc<dyn TokenService + Send + Sync>,
    user_repository: Arc<dyn UserRepository + Send + Sync>,
    team_service: Arc<dyn TeamService + Send + Sync>,
  ) -> Self {
    Self {
      state: ApiState {
        auth_service,
        token_service,
        user_repository,
        team_service,
      },
      router: Self::setup_routes(),
    }
  }

  /// defines api routes and respective handlers
  fn setup_routes() -> Router<ApiState> {
    let auth_router = auth::make_router();
    let team_router = team::make_router();

    let foo_router =
      Router::new().route("/", get(async || "Hello world!"));

    Router::new()
      .nest("/auth", auth_router)
      .nest("/teams", team_router)
      .nest("/foo", foo_router)
  }

  pub async fn serve(
    &self,
    sockaddr: std::net::SocketAddr,
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
}
