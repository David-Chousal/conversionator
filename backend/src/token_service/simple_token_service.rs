use std::{
  collections::HashMap,
  sync::{OnceLock, RwLock},
};

use crate::types::*;

use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use chrono::Utc;
use rand::RngCore;

use crate::token_service::TokenService;

#[derive(Clone)]
pub struct Token {
  pub token_string: String,
  pub user_id: u64,
  pub expires: chrono::DateTime<Utc>,
}

pub struct SimpleTokenService {
  default_lifetime: chrono::Duration,

  active_tokens: RwLock<HashMap<String, Token>>,
}

impl SimpleTokenService {
  pub fn get_default_instance() -> &'static Self {
    static INSTANCE: OnceLock<SimpleTokenService> = OnceLock::new();
    return INSTANCE.get_or_init(|| SimpleTokenService {
      default_lifetime: chrono::Duration::days(1),
      active_tokens: RwLock::new(HashMap::new()),
    });
  }

  fn generate_token_string() -> String {
    let mut bytes = [0u8; 32];
    rand::rng().fill_bytes(&mut bytes);
    let token_string = URL_SAFE_NO_PAD.encode(bytes);
    return token_string;
  }

  fn generate_token_with_lifetime(
    &self,
    user: User,
    lifetime: chrono::Duration,
  ) -> <Self as TokenService>::Token {
    let token_string = Self::generate_token_string();

    let t: Token = Token {
      token_string: token_string.clone(),
      user_id: user.id,
      expires: Utc::now() + lifetime,
    };

    let lock_result = self.active_tokens.write();
    match lock_result {
      Ok(mut rwg) => rwg.insert(token_string, t.clone()),
      Err(pe) => panic!("{}", pe),
    };

    return t;
  }

  pub fn cleanup_expired(&self) {
    let now = Utc::now();
    self
      .active_tokens
      .write()
      .unwrap()
      .retain(|_, v| v.expires > now);
  }
}

impl TokenService for SimpleTokenService {
  type Token = Token;

  fn generate_token(&self, user: User) -> Self::Token {
    self.generate_token_with_lifetime(user, self.default_lifetime)
  }

  fn verify_token(&self, token_str: &str) -> bool {
    return self.active_tokens.read().unwrap().contains_key(token_str);
  }

  fn return_token(&self, token_str: &str) {
    self.active_tokens.write().unwrap().remove(token_str);
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn foo() {
    assert!(true)
  }
}
