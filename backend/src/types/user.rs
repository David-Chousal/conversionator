use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::auth_service::{AuthService, SimpleAuthService};

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum UserRole {
  User = 0,
  Admin = 1,
}

#[derive(Hash, Serialize, Deserialize, Clone)]
pub struct User {
  pub id: u128,
  pub username: String,
  pub password_hash: <SimpleAuthService as AuthService>::PasswordHash,
  pub email: String,
  pub role: UserRole,
  pub created_at: chrono::DateTime<Utc>,
  pub team_ids: Vec<u128>,
}

impl User {
  pub fn get_dummy() -> Self {
    User {
      id: 0,
      username: String::from("foo"),
      password_hash: 0,
      role: UserRole::User,
      email: String::from("foo"),
      created_at: DateTime::from_timestamp(0, 0).unwrap(),
      team_ids: vec![],
    }
  }
}
