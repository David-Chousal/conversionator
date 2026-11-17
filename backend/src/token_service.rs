use crate::types::*;

mod simple_token_service;

pub use simple_token_service::{SimpleTokenService, Token};

pub trait TokenService {
  fn generate_token(&self, user: &User) -> String;
  fn verify_token(&self, token_str: &str) -> bool;
  fn return_token(&self, token_str: &str);

  fn get_role(&self, token_str: &str) -> Option<UserRole>;

  /// The full token (including the user id), when present and unexpired.
  fn get_token(&self, token_str: &str) -> Option<Token>;
}
