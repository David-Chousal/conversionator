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
  pub user_id: u128,
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

  pub fn validate_token_string(token_str: &str) -> bool {
    if token_str.len() != 43 {
      return false;
    }

    if let Ok(bytes) = URL_SAFE_NO_PAD.decode(token_str) {
      return bytes.len() == 32;
    }

    return false;
  }

  fn generate_token_with_lifetime(
    &self,
    user: &User,
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

  fn generate_token(&self, user: &User) -> Self::Token {
    self.generate_token_with_lifetime(user, self.default_lifetime)
  }

  fn verify_token(&self, token_str: &str) -> bool {
    if !Self::validate_token_string(token_str) {
      return false;
    }
    if let Some(t) = self.active_tokens.read().unwrap().get(token_str) {
      if t.expires > Utc::now() {
        return true;
      } else {
        self.active_tokens.write().unwrap().remove(token_str);
      }
    }
    return false;
  }

  fn return_token(&self, token_str: &str) {
    if !Self::validate_token_string(token_str) {
      return;
    }
    self.active_tokens.write().unwrap().remove(token_str);
  }
}

#[cfg(test)]
mod tests {
  use chrono::TimeDelta;

  use super::*;

  #[test]
  fn generate_token_string_works() {
    let s = SimpleTokenService::generate_token_string();
    assert!(!s.is_empty());
  }

  #[test]
  fn validate_token_string_works() {
    let good = vec![
      // random valid 32-byte base64 strings
      "ouHscPlE4L6fYCUA6zlCjqckou46e_iFbOEfZjZa5-Y",
      "RF7JM82Yvsh-2oJe20ivOU33SccYud0aUBmB6vmgPis",
      "ir2qZHC-CZ2-u4giZ3wmLvtKGx4quJsn4i2nXOVuiYM",
      "VMeK45pfgsKl1qiO4Vc5tzBqoDFkcjLiIhpnNGkcv3A",
      "OyVRKZROtGA2lA_uIxoAEOigXN4Swp5D8aPdyjcVW58",
      "soWDVu1uLBe-MvSsF7jETO47qu0y60UBOPUv69uszE4",
      "TISyHR8fMIekYmaMOGiw_SX6X3nXjcZHWj_tmkYx_cE",
      "eAupXxenSTcoSwT7FWhsq75R_Dfe5P4JuRwpEFqj0jI",
      "Hw2fv0g1_UA8yD_lkAQxu1HXGbk3fpPLGo8Sz9nlVnU",
      "ahi1GB97Cv0k673CNaDx_0XUiE6i5PoN2qC1l9_EumU",
    ];

    let bad = vec![
      "",
      "foo",
      "Wg4uDezO9Xh-_rjkX9Ol_-8N2bq4cZ5BePDaiewv9g", // 31 bytes
      "PHCQ_Rj1ujC177AyZlhWkiMoD5prslq4EAvVUczWLaw8", // 33 bytes
    ];

    assert!(
      good
        .iter()
        .all(|s| SimpleTokenService::validate_token_string(&s)),
    );

    assert!(
      !bad
        .iter()
        .any(|s| SimpleTokenService::validate_token_string(&s))
    )
  }

  #[test]
  fn take_and_return_token_works() {
    let user = User::get_dummy();
    let token_service = SimpleTokenService::get_default_instance();

    let token = token_service.generate_token(&user);
    assert!(token_service.verify_token(&token.token_string));
    token_service.return_token(&token.token_string);
    assert!(!token_service.verify_token(&token.token_string));
  }

  #[test]
  fn take_and_return_multiple_tokens_works() {
    let user = User::get_dummy();
    let token_service = SimpleTokenService::get_default_instance();

    let t1 = token_service.generate_token(&user);
    assert!(token_service.verify_token(&t1.token_string));
    let t2 = token_service.generate_token(&user);
    assert!(token_service.verify_token(&t2.token_string));

    token_service.return_token(&t1.token_string);
    assert!(!token_service.verify_token(&t1.token_string));
    token_service.return_token(&t2.token_string);
    assert!(!token_service.verify_token(&t2.token_string));
  }

  #[test]
  fn token_timeout_works() {
    let user = User::get_dummy();
    let token_service = SimpleTokenService::get_default_instance();

    let token = token_service.generate_token_with_lifetime(&user, TimeDelta::zero());
    std::thread::sleep(std::time::Duration::from_micros(10));
    assert!(!token_service.verify_token(&token.token_string));
  }
}
