use std::{
  collections::HashMap,
  fs::File,
  io::{Read, Write},
};

use crate::{
  database::{UserRepository, team_repository::TeamRepository},
  types::{Team, User},
};

pub struct SimpleDatabase {
  db_file: File,
  storage: SimpleDatabaseStorage,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct SimpleDatabaseStorage {
  user_store: HashMap<u64, User>,
  team_store: HashMap<u64, Team>,
}

impl SimpleDatabaseStorage {
  pub fn is_empty(&self) -> bool {
    self.user_store.is_empty() && self.team_store.is_empty()
  }
}

impl SimpleDatabase {
  pub fn from_file(file: File) -> Self {
    if let Ok(storage) = rmp_serde::from_read(&file) {
      return SimpleDatabase {
        db_file: file,
        storage,
      };
    } else {
      panic!("failed to read db file")
    }
  }

  fn sync_to_file(&self) {
    let buf = rmp_serde::encode::to_vec(&self.storage).unwrap(); // fix
    self.db_file.lock().unwrap();
    if let Ok(n) = (&self.db_file).write(&buf) {
      if n != buf.len() {
        todo!(); // TODO
      }
    } else {
      panic!("failed to write to db file");
    };
    self.db_file.unlock().unwrap();
    todo!()
  }
}

impl Drop for SimpleDatabase {
  fn drop(&mut self) {
    self.sync_to_file();
    todo!() // sync to file before dropping
  }
}

impl UserRepository for SimpleDatabase {
  fn save(&self, user: &User) -> Option<User> {
    todo!()
  }

  fn get_by_id(&self, id: u64) -> Option<User> {
    todo!()
  }

  fn get_by_username(&self, id: u64) -> Option<User> {
    todo!()
  }

  fn delete_by_id(&self, id: u64) -> Result<User, &str> {
    todo!()
  }
}

impl TeamRepository for SimpleDatabase {
  fn save(&self, team: &Team) -> Option<Team> {
    todo!()
  }

  fn get_by_id(&self, id: u64) -> Option<Team> {
    todo!()
  }

  fn delete_by_id(&self, id: u64) -> Result<Team, &str> {
    todo!()
  }
}
