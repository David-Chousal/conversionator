use std::{
  collections::HashMap,
  sync::{Arc, OnceLock, RwLock},
};

use crate::types::*;

use chrono::Utc;

use crate::token_service::TokenService;

#[derive(Clone)]
pub struct Token {
  token_string: String,
  user_id: u64,
  expires: chrono::DateTime<Utc>,
}

pub struct SimpleTokenService {
  default_lifetime: chrono::Duration,

  active_tokens: Arc<RwLock<HashMap<String, Token>>>,
}

impl SimpleTokenService {
  fn get_default_instance() -> &'static Self {
    static INSTANCE: OnceLock<SimpleTokenService> = OnceLock::new();
    return INSTANCE.get_or_init(|| SimpleTokenService {
      default_lifetime: chrono::Duration::days(1),
      active_tokens: Arc::new(RwLock::new(HashMap::new())),
    });
  }

  fn generate_token_with_lifetime(
    &self,
    user: User,
    lifetime: chrono::Duration,
  ) -> <Self as TokenService>::Token {
    let token_string = "foo".to_owned();

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
