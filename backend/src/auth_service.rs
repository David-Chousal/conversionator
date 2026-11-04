mod simple_auth_service;

pub use simple_auth_service::SimpleAuthService;

use crate::Component;

pub trait AuthService<P>: Component {
  fn login(
    &self,
    username: String,
    password_hash: P,
  ) -> Result<String, &'static str>;
  fn logout(&self, token_str: &str) -> Result<(), &'static str>;
  fn verify_token(&self, token_str: &str) -> bool;
}
