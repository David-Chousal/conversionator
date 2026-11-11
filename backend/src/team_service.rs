use crate::types::Team;

pub mod simple_team_service;

pub trait TeamService {
  fn create_team(
    &self,
    name: &str,
    description: &str,
  ) -> Result<Team, &'static str>;
  fn get_team_by_id(&self, id: u128) -> Option<Team>;
  fn delete_team_by_id(&self, id: u128) -> Option<Team>;
}
