use crate::types::User;

trait UserRepository {
  fn write_user(&self, user: &User);
  fn get_by_id(&self, id: u64) -> Option<User>;
  fn get_by_username(&self, id: u64) -> Option<User>;
}
