use std::sync::Arc;

use crate::{
  auth_service::AuthService,
  database::UserRepository,
  token_service::{SimpleTokenService, TokenService},
  types::User,
};

pub struct SimpleAuthService {
  token_service: Arc<dyn TokenService + Send + Sync>,
  user_repository: Arc<dyn UserRepository>,
}

impl SimpleAuthService {
  pub fn new(
    token_service: Arc<dyn TokenService + Send + Sync>,
    user_repository: Arc<dyn UserRepository>,
  ) -> Self {
    Self {
      token_service,
      user_repository,
    }
  }

  pub fn register(&self, user: &User) {
    self.user_repository.save(user);
  }
}

impl AuthService<u128> for SimpleAuthService {
  fn login(
    &self,
    username: String,
    password_hash: u128,
  ) -> Result<String, &'static str> {
    if let Some(u) = self.user_repository.get_by_username(&username) {
      if password_hash != u.password_hash {
        return Err("Password incorrect");
      }
      return Ok(self.token_service.generate_token(&u));
    } else {
      return Err("User not found");
    }
  }

  fn logout(&self, token_str: &str) -> Result<(), &'static str> {
    Ok(self.token_service.return_token(token_str))
  }

  fn verify_token(&self, token_str: &str) -> bool {
    SimpleTokenService::validate_token_string(token_str)
      && self.token_service.verify_token(token_str)
  }
}

#[cfg(test)]
mod tests {
  use chrono::TimeDelta;

  use crate::{database::SimpleDatabase, types::User};

  use super::*;

  const ONE_DAY: TimeDelta = TimeDelta::days(1);

  #[test]
  fn login_works() {
    let u = User::get_dummy();
    let user_repository = Arc::new(SimpleDatabase::new());
    let token_service = Arc::new(SimpleTokenService::new(ONE_DAY));
    let auth_service =
      SimpleAuthService::new(token_service, user_repository);
    auth_service.register(&u);
    match auth_service.login(u.username, u.password_hash) {
      Ok(t) => assert!(auth_service.token_service.verify_token(&t)),
      Err(e) => panic!("login failed: {}", e),
    };
  }

  #[test]
  fn login_with_wrong_password_fails() {
    let u = User::get_dummy();
    let user_repository = Arc::new(SimpleDatabase::new());
    let token_service = Arc::new(SimpleTokenService::new(ONE_DAY));
    let auth_service =
      SimpleAuthService::new(token_service, user_repository);
    auth_service.register(&u);
    assert!(
      auth_service.login(u.username, u.password_hash + 1).is_err()
    );
  }

  #[test]
  fn verify_token_works() {
    let u = User::get_dummy();
    let user_repository = Arc::new(SimpleDatabase::new());
    let token_service = Arc::new(SimpleTokenService::new(ONE_DAY));
    let auth_service =
      SimpleAuthService::new(token_service, user_repository);
    auth_service.register(&u);
    match auth_service.login(u.username, u.password_hash) {
      Ok(t) => assert!(auth_service.verify_token(&t)),
      Err(e) => panic!("login failed: {}", e),
    };
  }

  #[test]
  fn verify_token_wrong_token_fails() {
    let u = User::get_dummy();
    let user_repository = Arc::new(SimpleDatabase::new());
    let token_service = Arc::new(SimpleTokenService::new(ONE_DAY));
    let auth_service =
      SimpleAuthService::new(token_service, user_repository);
    auth_service.register(&u);
    match auth_service.login(u.username, u.password_hash) {
      Ok(_) => assert!(
        !auth_service
          .verify_token("RF7JM82Yvsh-2oJe20ivOU33SccYud0aUBmB6vmgPis")
      ),
      Err(e) => panic!("login failed: {}", e),
    };
  }

  #[test]
  fn logout_works() {
    let u = User::get_dummy();
    let user_repository = Arc::new(SimpleDatabase::new());
    let token_service = Arc::new(SimpleTokenService::new(ONE_DAY));
    let auth_service =
      SimpleAuthService::new(token_service, user_repository);
    auth_service.register(&u);
    let t = auth_service.login(u.username, u.password_hash).unwrap();
    assert!(auth_service.logout(&t).is_ok());
  }
}
