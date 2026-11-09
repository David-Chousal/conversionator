use std::{net::SocketAddr, sync::Arc};

use axum::{Router, routing::get};

pub mod api;

mod app_config;
pub use app_config::AppConfig;
use chrono::TimeDelta;

use crate::{
  app::api::{CorApi, auth_service},
  auth_service::{AuthService, SimpleAuthService},
  database::{SimpleDatabase, UserRepository},
  token_service::{self, SimpleTokenService},
};

pub struct App {
  config: AppConfig,
}

impl App {
  pub fn new(config: AppConfig) -> Self {
    Self { config }
  }

  pub async fn run(&self) -> tokio::io::Result<()> {
    let db = Arc::new(SimpleDatabase::new());
    let token_service =
      Arc::new(SimpleTokenService::new(TimeDelta::days(1)));
    let auth_service = Arc::new(SimpleAuthService::new(
      token_service.clone(),
      db as Arc<dyn UserRepository>,
    ));
    let api = CorApi::new(auth_service, token_service);
    let sockaddr = (self.config.listen_addr, self.config.listen_port);
    api.serve(SocketAddr::from(sockaddr)).await?;
    Ok(())
  }
}
