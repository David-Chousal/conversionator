use crate::{
  auth_service::AuthService,
  database::UserRepository,
  token_service::{SimpleTokenService, TokenService},
};

pub struct SimpleAuthService {
  user_repository: Box<dyn UserRepository>,
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
