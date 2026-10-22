use std::{collections::HashMap, fs::File, io::Write};

use crate::{
  database::{UserRepository, team_repository::TeamRepository},
  types::{Team, User},
};

pub struct SimpleDatabase {
  db_file: File,
  user_store: HashMap<u64, User>,
  team_store: HashMap<u64, Team>,
}

impl SimpleDatabase {
  fn write_user_store(&self) {
    // let buf = rmp_serde::encode::to_vec(&self.user_store).unwrap();
    // self.db_file.lock();
    // self.db_file.write(&buf);
    todo!();
  }

  fn sync_to_file(&self) {
    todo!();
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
