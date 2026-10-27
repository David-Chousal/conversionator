use std::sync::LazyLock;

use crate::{
  auth_service::AuthService,
  database::{SimpleDatabase, UserRepository, user_repository},
  token_service::{SimpleTokenService, TokenService},
  types::User,
};

pub struct SimpleAuthService {
  user_repository: &'static dyn UserRepository,
}

impl SimpleAuthService {
  pub fn get_default_instance() -> &'static Self {
    static INSTANCE: LazyLock<SimpleAuthService> =
      LazyLock::new(|| SimpleAuthService::new(SimpleDatabase::get_default_instance()));
    &INSTANCE
  }

  pub fn new(user_repository: &'static dyn UserRepository) -> Self {
    Self { user_repository }
  }

  pub fn register(&self, user: &User) {
    self.user_repository.save(user);
  }
}

impl AuthService for SimpleAuthService {
  type Token = <SimpleTokenService as TokenService>::Token;

  type PasswordHash = u128;

  fn login(
    &self,
    username: String,
    password_hash: Self::PasswordHash,
  ) -> Result<Self::Token, &'static str> {
    if let Some(u) = self.user_repository.get_by_username(&username) {
      if password_hash != u.password_hash {
        return Err("Password incorrect");
      }
      return Ok(SimpleTokenService::get_default_instance().generate_token(&u));
    } else {
      return Err("User not found");
    }
  }

  fn logout(&self, token_str: &str) -> Result<(), &'static str> {
    Ok(SimpleTokenService::get_default_instance().return_token(token_str))
  }

  fn verify_token(&self, token_str: &str) -> bool {
    SimpleTokenService::validate_token_string(token_str)
      && SimpleTokenService::get_default_instance().verify_token(token_str)
  }
}

#[cfg(test)]
mod tests {
  use crate::types::User;

  use super::*;

  #[test]
  fn login_works() {
    let u = User::get_dummy();
    let auth_service = SimpleAuthService::get_default_instance();
    auth_service.register(&u);
    match auth_service.login(u.username, u.password_hash) {
      Ok(t) => assert!(SimpleTokenService::get_default_instance().verify_token(&t.token_string)),
      Err(e) => panic!("login failed: {}", e),
    };
  }

  #[test]
  fn login_with_wrong_password_fails() {
    let u = User::get_dummy();
    let auth_service = SimpleAuthService::get_default_instance();
    auth_service.register(&u);
    assert!(auth_service.login(u.username, u.password_hash + 1).is_err());
  }

  #[test]
  fn verify_token_works() {
    let u = User::get_dummy();
    let auth_service = SimpleAuthService::get_default_instance();
    auth_service.register(&u);
    match auth_service.login(u.username, u.password_hash) {
      Ok(t) => assert!(auth_service.verify_token(&t.token_string)),
      Err(e) => panic!("login failed: {}", e),
    };
  }

  #[test]
  fn verify_token_wrong_token_fails() {
    let u = User::get_dummy();
    let auth_service = SimpleAuthService::get_default_instance();
    auth_service.register(&u);
    match auth_service.login(u.username, u.password_hash) {
      Ok(_) => assert!(!auth_service.verify_token("RF7JM82Yvsh-2oJe20ivOU33SccYud0aUBmB6vmgPis")),
      Err(e) => panic!("login failed: {}", e),
    };
  }

  #[test]
  fn logout_works() {
    let u = User::get_dummy();
    let auth_service = SimpleAuthService::get_default_instance();
    auth_service.register(&u);
    let t = auth_service.login(u.username, u.password_hash).unwrap();
    assert!(auth_service.logout(&t.token_string).is_ok());
  }
}
