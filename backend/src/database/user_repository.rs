use crate::{database::SimpleDatabase, types::User};

pub trait UserRepository: Send + Sync {
  fn save(&self, user: &User) -> Option<User>;
  fn get_by_id(&self, id: u128) -> Option<User>;
  fn get_by_username(&self, username: &str) -> Option<User>;
  fn delete_by_id(&self, id: u128) -> Result<User, &str>;
}

pub fn get_default() -> &'static dyn UserRepository {
  return SimpleDatabase::get_default_instance();
}
