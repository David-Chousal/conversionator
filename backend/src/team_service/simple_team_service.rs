use std::sync::Arc;

use chrono::Utc;
use uuid::Uuid;

use crate::{
  database::{TeamRepository, UserRepository},
  role_check::require_role,
  team_service::TeamService,
  types::{Team, User, UserRole},
};

pub struct SimpleTeamService {
  team_repository: Arc<dyn TeamRepository>,
  user_repository: Arc<dyn UserRepository>,
}

impl SimpleTeamService {
  pub fn new(
    team_repository: Arc<dyn TeamRepository>,
    user_repository: Arc<dyn UserRepository>,
  ) -> Self {
    Self {
      team_repository,
      user_repository,
    }
  }
}

impl TeamService for SimpleTeamService {
  fn create_team(
    &self,
    name: &str,
    description: &str,
    owner: &User,
  ) -> Result<Team, &'static str> {
    require_role(owner, UserRole::Admin)?;
    let team = Team {
      id: Uuid::new_v4().as_u128(),
      name: name.to_string(),
      description: description.to_string(),
      owner_id: owner.id,
      created_at: Utc::now(),
    };
    // save returns the *replaced* previous row, so None just means "new team".
    self.team_repository.save(&team);
    Ok(team)
  }

  fn get_all_teams(&self, requester: &User) -> Vec<Team> {
    if require_role(requester, UserRole::Admin).is_err() {
      return Vec::new();
    }
    self.team_repository.get_all()
  }

  fn get_team_by_id(&self, id: u128) -> Option<Team> {
    self.team_repository.get_by_id(id)
  }

  fn delete_team(&self, id: u128, requester: &User) -> Result<Team, &'static str> {
    require_role(requester, UserRole::Admin)?;
    if self.team_repository.get_by_id(id).is_none() {
      return Err("team not found");
    }
    // get_by_id just confirmed it exists, so this is the "team not found" branch at worst.
    self.team_repository.delete_by_id(id).map_err(|_| "team not found")
  }

  fn add_member(&self, team_id: u128, user_id: u128, requester: &User) -> Result<Team, &'static str> {
    require_role(requester, UserRole::Admin)?;
    let team = self.team_repository.get_by_id(team_id).ok_or("team not found")?;
    let mut user = self.user_repository.get_by_id(user_id).ok_or("user not found")?;
    // Idempotent: adding an existing member succeeds without change.
    if !user.team_ids.contains(&team_id) {
      user.team_ids.push(team_id);
      // save returns the *replaced* previous row; None is success for a new row.
      self.user_repository.save(&user);
    }
    Ok(team)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::database::SimpleDatabase;

  struct Fixture {
    service: SimpleTeamService,
    database: Arc<SimpleDatabase>,
    admin: User,
    member: User,
  }

  fn fixture() -> Fixture {
    let database = Arc::new(SimpleDatabase::new());
    let user_repository: Arc<dyn UserRepository> = database.clone();
    let team_repository: Arc<dyn TeamRepository> = database.clone();
    let mut admin = User::get_dummy();
    admin.id = 1;
    admin.role = UserRole::Admin;
    let mut member = User::get_dummy();
    member.id = 2;
    member.role = UserRole::User;
    database
      .as_user_repository()
      .save(&member.clone());
    Fixture {
      service: SimpleTeamService::new(team_repository, user_repository),
      database,
      admin,
      member,
    }
  }

  #[test]
  fn create_team_works() {
    let f = fixture();
    let team = f
      .service
      .create_team("Platform", "The platform team", &f.admin)
      .unwrap();
    assert_eq!(team.name, "Platform");
    assert_eq!(team.owner_id, f.admin.id);
    assert_eq!(f.service.get_team_by_id(team.id).unwrap().name, "Platform");
  }

  #[test]
  fn create_team_requires_admin() {
    let f = fixture();
    assert!(f.service.create_team("X", "", &f.member).is_err());
  }

  #[test]
  fn get_all_teams_requires_admin() {
    let f = fixture();
    f.service.create_team("A", "", &f.admin).unwrap();
    f.service.create_team("B", "", &f.admin).unwrap();
    assert_eq!(f.service.get_all_teams(&f.admin).len(), 2);
    assert!(f.service.get_all_teams(&f.member).is_empty());
  }

  #[test]
  fn delete_team_works_and_requires_admin() {
    let f = fixture();
    let team = f.service.create_team("A", "", &f.admin).unwrap();
    assert!(f.service.delete_team(team.id, &f.member).is_err());
    assert!(f.service.delete_team(team.id, &f.admin).is_ok());
    assert!(f.service.get_team_by_id(team.id).is_none());
    assert!(f.service.delete_team(team.id, &f.admin).is_err());
  }

  #[test]
  fn add_member_works_and_is_idempotent() {
    let f = fixture();
    let team = f.service.create_team("A", "", &f.admin).unwrap();
    f.service.add_member(team.id, f.member.id, &f.admin).unwrap();
    f.service.add_member(team.id, f.member.id, &f.admin).unwrap();
    let stored = f
      .database
      .as_user_repository()
      .get_by_id(f.member.id)
      .unwrap();
    assert_eq!(stored.team_ids, vec![team.id]);
  }

  #[test]
  fn add_member_requires_admin_and_valid_ids() {
    let f = fixture();
    let team = f.service.create_team("A", "", &f.admin).unwrap();
    assert!(f.service.add_member(team.id, f.member.id, &f.member).is_err());
    assert!(f.service.add_member(999, f.member.id, &f.admin).is_err());
    assert!(f.service.add_member(team.id, 999, &f.admin).is_err());
  }
}
