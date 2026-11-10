use std::{net::SocketAddr, sync::Arc};

use axum::{Router, routing::get};
use hyper::{body::Incoming, server::conn::http1};
use hyper_util::rt::TokioIo;
use tower::Service as _;

use crate::{auth_service::AuthService, token_service::TokenService};

pub mod auth;

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
    let auth_router = auth::make_router();

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
}
