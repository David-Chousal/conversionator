use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum UserRole {
  User = 0,
  Admin = 1,
}

#[derive(Hash, Serialize, Deserialize, Clone)]
pub struct User {
  pub id: u64,
  pub username: String,
  pub password_hash: u64,
  pub email: String,
  pub role: UserRole,
  pub created_at: chrono::DateTime<Utc>,
}
