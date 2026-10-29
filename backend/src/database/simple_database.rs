use std::{
  collections::HashMap,
  fs::File,
  io::Write,
  sync::{LazyLock, RwLock},
};

use crate::{
  database::{UserRepository, team_repository::TeamRepository},
  types::{Team, User},
};

pub struct SimpleDatabase {
  db_file: File,
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
  DecodeError(rmp_serde::decode::Error),
  WriteError(std::io::Error),
}

impl std::fmt::Display for SyncError {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    match self {
      Self::DecodeError(e) => e.fmt(f),
      Self::WriteError(e) => e.fmt(f),
    }
  }
}

impl SimpleDatabase {
  pub fn get_default_instance() -> &'static Self {
    static INSTANCE: LazyLock<SimpleDatabase> =
      LazyLock::new(|| SimpleDatabase::with_filename("SimpleDatabase_default.db"));
    &INSTANCE
  }

  fn with_filename(name: &str) -> Self {
    if let p = std::path::Path::new(name)
      && p.exists()
      && let Ok(f) = File::open(p)
    {
      match Self::from_file(f) {
        Ok(db) => return db,
        Err(e) => {
          eprintln!("failed to read db file: {}", e);
          eprintln!("backing up old file to {}.bak", name);
        }
      }
    }
    if let Ok(f) = File::create_new(name) {
      return SimpleDatabase {
        db_file: f,
        data: RwLock::new(SimpleDatabaseData::new()),
      };
    } else {
      panic!("failed to init db");
    }
  }

  fn from_file(file: File) -> Result<Self, rmp_serde::decode::Error> {
    rmp_serde::from_read(&file).map(|data| SimpleDatabase {
      db_file: file,
      data: RwLock::new(data),
    })
  }

  pub fn sync_to_file(&self) -> Result<(), SyncError> {
    // TODO async maybe?
    let buf = rmp_serde::encode::to_vec::<SimpleDatabaseData>(&self.data.read().unwrap()).unwrap(); // are these unwraps okay
    self.db_file.lock().unwrap();
    if let Err(e) = (&self.db_file).write_all(&buf) {
      let _ = self.db_file.unlock();
      return Err(SyncError::WriteError(e));
    };
    self.db_file.unlock().unwrap();
    Ok(())
  }
}

impl Drop for SimpleDatabase {
  fn drop(&mut self) {
    match self.sync_to_file() {
      Ok(_) => (),
      Err(e) => eprintln!("error syncing to file: {}", e),
    };
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
mod tests {}
