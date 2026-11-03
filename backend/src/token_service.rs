use crate::types::*;

mod simple_token_service;

pub use simple_token_service::SimpleTokenService;

pub trait TokenService {
  fn generate_token(&self, user: &User) -> String;
  fn verify_token(&self, token_str: &str) -> bool;
  fn return_token(&self, token_str: &str);
}
