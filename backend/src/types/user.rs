use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum UserRole {
  User = 0,
  Admin = 1,
}

#[derive(Hash, Serialize, Deserialize, Clone)]
pub struct User {
  pub id: u128,
  pub username: String,
  pub password_hash: u128,
  pub email: String,
  pub role: UserRole,
  pub created_at: chrono::DateTime<Utc>,
  pub team_ids: Vec<u128>,
}
