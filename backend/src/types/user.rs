use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(
  Clone,
  Copy,
  PartialEq,
  Eq,
  PartialOrd,
  Ord,
  Hash,
  Serialize,
  Deserialize,
)]
pub enum UserRole {
  User = 0,
  Admin = 1,
}

#[derive(Hash, Serialize, Deserialize, Clone)]
pub struct User {
  pub id: u128,
  pub username: String,
  /** bcrypt hash; produced by hashing the plain password server-side at registration. */
  pub password_hash: String,
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
      // bcrypt hash of "password" — the seeded demo credentials
      password_hash: String::from("$2b$12$z.CRXSYDKf7vhp2qCjGlTOul/WugNkHzbT9D0owYrm2jhQONLLEWO"),
      role: UserRole::User,
      email: String::from("foo"),
      created_at: DateTime::from_timestamp(0, 0).unwrap(),
      team_ids: vec![],
    }
  }
}
