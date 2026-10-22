use crate::types::User;

pub trait UserRepository {
  fn save(&self, user: &User) -> Option<User>;
  fn get_by_id(&self, id: u64) -> Option<User>;
  fn get_by_username(&self, id: u64) -> Option<User>;
  fn delete_by_id(&self, id: u64) -> Result<User, &str>;
}
