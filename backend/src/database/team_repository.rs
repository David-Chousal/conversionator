use crate::types::Team;

pub trait TeamRepository {
  fn save(&self, team: &Team) -> Option<Team>;
  fn get_by_id(&self, id: u64) -> Option<Team>;
  fn delete_by_id(&self, id: u64) -> Result<Team, &str>;
}
