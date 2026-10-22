use chrono::Utc;
use serde::Serialize;

#[derive(PartialEq, Eq, PartialOrd, Ord, Hash, Serialize)]
pub enum UserRole {
  User = 0,
  Admin = 1,
}

#[derive(Hash, Serialize)]
pub struct User {
  pub id: u64,
  pub username: String,
  pub password_hash: u64, // Argon2,
  pub email: String,
  pub role: UserRole,
  pub created_at: chrono::DateTime<Utc>,
}
