use crate::{Component, types::Team};

pub trait TeamRepository: Component {
  fn save(&self, team: &Team) -> Option<Team>;
  fn get_by_id(&self, id: u128) -> Option<Team>;
  fn delete_by_id(&self, id: u128) -> Result<Team, &str>;
}
