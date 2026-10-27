mod simple_auth_service;

pub use simple_auth_service::SimpleAuthService;

pub trait AuthService {
  type Token;
  type PasswordHash;

  fn login(
    &self,
    username: String,
    password_hash: Self::PasswordHash,
  ) -> Result<Self::Token, &'static str>;
  fn logout(&self, token_str: &str) -> Result<(), &'static str>;
  fn verify_token(&self, token_str: &str) -> bool;
}

pub fn get_default() -> &'static impl AuthService {
  return SimpleAuthService::get_default_instance();
}
