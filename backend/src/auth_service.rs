mod simple_auth_service;

pub use simple_auth_service::SimpleAuthService;

pub trait AuthService {
  fn login(
    &self,
    username: String,
    password: &str,
  ) -> Result<String, &'static str>;
  fn logout(&self, token_str: &str) -> Result<(), &'static str>;
  fn verify_token(&self, token_str: &str) -> bool;
}
