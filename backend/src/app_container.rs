use std::sync::Arc;

use chrono::TimeDelta;

use crate::{
  auth_service::{AuthService, SimpleAuthService},
  component::Component,
  database::{SimpleDatabase, TeamRepository, UserRepository},
  token_service::{SimpleTokenService, TokenService},
};

pub trait AppContainer {
  fn get_components(&self) -> Vec<Arc<dyn Component>>;

  fn init(&self) {
    self.get_components().iter().for_each(|c| c.init());
  }

  fn periodic(&self) {
    self.get_components().iter().for_each(|c| c.periodic());
  }

  fn cleanup(&self) {
    self.get_components().iter().for_each(|c| c.cleanup());
  }

  fn get_token_service(&self) -> Arc<dyn TokenService>;
  fn get_auth_service(&self) -> Arc<dyn AuthService<u128>>;

  fn get_user_repository(&self) -> Arc<dyn UserRepository>;
  fn get_team_repository(&self) -> Arc<dyn TeamRepository>;
}

pub struct CORAppContainer {
  components: Vec<Arc<dyn Component>>,
  db: Arc<SimpleDatabase>,
  token_service: Arc<SimpleTokenService>,
  auth_service: Arc<SimpleAuthService>,
}

impl CORAppContainer {
  pub fn new() -> Self {
    let db = Arc::new(SimpleDatabase::new());
    let token_service =
      Arc::new(SimpleTokenService::new(TimeDelta::days(1)));
    let auth_service = Arc::new(SimpleAuthService::new(
      token_service.clone(),
      db.clone(),
    ));

    let components = vec![
      db.clone() as Arc<dyn Component>,
      token_service.clone() as Arc<dyn Component>,
      auth_service.clone() as Arc<dyn Component>,
    ];

    let out = Self {
      components,
      db,
      token_service,
      auth_service,
    };

    out
  }
}

impl AppContainer for CORAppContainer {
  fn get_components(&self) -> Vec<Arc<dyn Component>> {
    self.components.clone()
  }

  fn get_token_service(&self) -> Arc<dyn TokenService> {
    self.token_service.clone()
  }

  fn get_auth_service(&self) -> Arc<dyn AuthService<u128>> {
    self.auth_service.clone()
  }

  fn get_user_repository(&self) -> Arc<dyn UserRepository> {
    self.db.clone()
  }

  fn get_team_repository(&self) -> Arc<dyn TeamRepository> {
    self.db.clone()
  }
}
