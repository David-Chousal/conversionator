use std::{net::SocketAddr, sync::Arc};

pub mod api;

mod app_config;
pub use app_config::AppConfig;
use chrono::TimeDelta;

use crate::{
  app::api::CorApi,
  auth_service::SimpleAuthService,
  database::{SimpleDatabase, UserRepository},
  team_service::SimpleTeamService,
  token_service::SimpleTokenService,
  types::{User, UserRole},
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
    let user_repository: Arc<dyn UserRepository + Send + Sync> = db.clone();
    let auth_service = Arc::new(SimpleAuthService::new(
      token_service.clone(),
      db.clone() as Arc<dyn UserRepository>,
    ));
    let team_service = Arc::new(SimpleTeamService::new(db.clone(), user_repository.clone()));
    // Seed the demo admin so login works against a fresh database (username "foo", password "password").
    let mut demo_user = User::get_dummy();
    demo_user.role = UserRole::Admin;
    auth_service.register(&demo_user);
    let api = CorApi::new(auth_service, token_service, user_repository, team_service);
    let sockaddr = (self.config.listen_addr, self.config.listen_port);
    api.serve(SocketAddr::from(sockaddr)).await?;
    Ok(())
  }
}
