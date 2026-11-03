use crate::{
  auth_service::AuthService,
  database::{TeamRepository, UserRepository},
  token_service::TokenService,
};

pub trait AppContainer {
  fn init();
  fn periodic();
  fn cleanup();

  fn get_token_service<'a>(&'a self) -> &'a dyn TokenService;
  fn get_auth_service<'a>(&'a self) -> &'a dyn AuthService<u128>;

  fn get_user_repository<'a>(&'a self) -> &'a dyn UserRepository;
  fn get_team_repository<'a>(&'a self) -> &'a dyn TeamRepository;
}
