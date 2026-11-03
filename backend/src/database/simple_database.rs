use std::{
  collections::HashMap,
  io::{Read, Write},
  sync::{LazyLock, RwLock},
};

use crate::{
  database::{UserRepository, team_repository::TeamRepository},
  types::{Team, User},
};

pub struct SimpleDatabase {
  data: RwLock<SimpleDatabaseData>,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct SimpleDatabaseData {
  user_store: HashMap<u128, User>,
  team_store: HashMap<u128, Team>,
}

impl SimpleDatabaseData {
  pub fn new() -> Self {
    SimpleDatabaseData {
      user_store: HashMap::new(),
      team_store: HashMap::new(),
    }
  }
}

pub enum SyncError {
  EncodeError(rmp_serde::encode::Error),
  DecodeError(rmp_serde::decode::Error),
  WriteError(std::io::Error),
}

impl std::fmt::Display for SyncError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::DecodeError(e) => write!(f, "SyncError: {}", e),
      Self::WriteError(e) => write!(f, "SyncError: {}", e),
      Self::EncodeError(e) => write!(f, "SyncError: {}", e),
    }
  }
}

impl SimpleDatabase {
  #[deprecated]
  pub fn get_default_instance() -> &'static Self {
    static INSTANCE: LazyLock<SimpleDatabase> =
      LazyLock::new(SimpleDatabase::new);
    &INSTANCE
  }

  pub fn new() -> Self {
    Self {
      data: RwLock::new(SimpleDatabaseData::new()),
    }
  }

  pub fn from_read<T: Read>(
    read: T,
  ) -> Result<Self, rmp_serde::decode::Error> {
    rmp_serde::from_read(read).map(|data| SimpleDatabase {
      data: RwLock::new(data),
    })
  }

  pub fn write_to<T: Write>(
    &self,
    dst: &mut T,
  ) -> Result<(), rmp_serde::encode::Error> {
    let data = match self.data.read() {
      Ok(d) => d,
      Err(e) => e.into_inner(),
    };
    rmp_serde::encode::write(dst, &*data)
  }

  pub fn get_rmp(&self) -> Result<Vec<u8>, rmp_serde::encode::Error> {
    let data = match self.data.read() {
      Ok(d) => d,
      Err(e) => e.into_inner(),
    };
    rmp_serde::encode::to_vec(&*data)
  }
}

impl UserRepository for SimpleDatabase {
  fn save(&self, user: &User) -> Option<User> {
    self
      .data
      .write()
      .unwrap()
      .user_store
      .insert(user.id, user.clone())
  }

  fn get_by_id(&self, id: u128) -> Option<User> {
    self
      .data
      .read()
      .unwrap()
      .user_store
      .get(&id)
      .map(|u| u.clone())
  }

  fn get_by_username(&self, username: &str) -> Option<User> {
    self
      .data
      .read()
      .unwrap()
      .user_store
      .iter()
      .find(|(_, v)| v.username == username)
      .map(|(_, v)| v.clone())
  }

  fn delete_by_id(&self, id: u128) -> Result<User, &str> {
    match self.data.write().unwrap().user_store.remove(&id) {
      Some(u) => Ok(u),
      None => Err("key not found"),
    }
  }
}

impl TeamRepository for SimpleDatabase {
  fn save(&self, team: &Team) -> Option<Team> {
    self
      .data
      .write()
      .unwrap()
      .team_store
      .insert(team.id, team.clone())
  }

  fn get_by_id(&self, id: u128) -> Option<Team> {
    self
      .data
      .read()
      .unwrap()
      .team_store
      .get(&id)
      .map(|u| u.clone())
  }

  fn delete_by_id(&self, id: u128) -> Result<Team, &str> {
    match self.data.write().unwrap().team_store.remove(&id) {
      Some(t) => Ok(t),
      None => Err("team not found"),
    }
  }
}

#[cfg(test)]
mod tests {

  #[test]
  fn foo() {
    assert!(true);
  }
}
