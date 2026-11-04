use crate::{Component, types::User};

pub trait UserRepository: Component + Send + Sync {
  fn save(&self, user: &User) -> Option<User>;
  fn get_by_id(&self, id: u128) -> Option<User>;
  fn get_by_username(&self, username: &str) -> Option<User>;
  fn delete_by_id(&self, id: u128) -> Result<User, &str>;
}
