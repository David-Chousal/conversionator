pub trait AuthService {
  type Token;
  type PasswordHash;

  fn login(username: String, password_hash: Self::PasswordHash) -> Self::Token;
  fn logout(token_str: &str) -> Result<(), &'static str>;
  fn verify_token(token_str: &str) -> bool;
}
