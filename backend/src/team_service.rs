use crate::types::{Team, User};

pub mod simple_team_service;

pub use simple_team_service::SimpleTeamService;

/// Team management is admin-only (see the RoleCheck note in the class diagram);
/// every method validates the requester's role itself.
pub trait TeamService: Send + Sync {
  fn create_team(&self, name: &str, description: &str, owner: &User) -> Result<Team, &'static str>;
  fn get_all_teams(&self, requester: &User) -> Vec<Team>;
  fn get_team_by_id(&self, id: u128) -> Option<Team>;
  fn delete_team(&self, id: u128, requester: &User) -> Result<Team, &'static str>;
  fn add_member(&self, team_id: u128, user_id: u128, requester: &User) -> Result<Team, &'static str>;
}
