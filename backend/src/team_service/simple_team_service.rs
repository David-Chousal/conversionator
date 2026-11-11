use crate::team_service::TeamService;

pub struct SimpleTeamService {}

impl SimpleTeamService {}

impl TeamService for SimpleTeamService {
  fn create_team(
    &self,
    name: &str,
    description: &str,
  ) -> Result<crate::types::Team, &'static str> {
    todo!()
  }

  fn get_team_by_id(&self, id: u128) -> Option<crate::types::Team> {
    todo!()
  }

  fn delete_team_by_id(&self, id: u128) -> Option<crate::types::Team> {
    todo!()
  }
}
