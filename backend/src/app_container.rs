use crate::{
  auth_service::AuthService,
  component::Component,
  database::{TeamRepository, UserRepository},
  token_service::TokenService,
};

pub trait AppContainer<'a> {
  fn get_components(&self) -> Vec<&'a dyn Component>;

  fn init(&self) {
    self.get_components().iter().for_each(|c| c.init());
  }

  fn periodic(&self) {
    self.get_components().iter().for_each(|c| c.periodic());
  }

  fn cleanup(&self) {
    self.get_components().iter().for_each(|c| c.cleanup());
  }

  fn get_token_service(&'a self) -> &'a dyn TokenService;
  fn get_auth_service(&'a self) -> &'a dyn AuthService<u128>;

  fn get_user_repository(&'a self) -> &'a dyn UserRepository;
  fn get_team_repository(&'a self) -> &'a dyn TeamRepository;
}
