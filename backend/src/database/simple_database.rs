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

impl SimpleDatabase {
  pub fn get_default_instance() -> &'static Self {
    static INSTANCE: LazyLock<SimpleDatabase> =
      LazyLock::new(|| SimpleDatabase::with_filename("SimpleDatabase_default.db"));
    &INSTANCE
  }

  fn with_filename(name: &str) -> Self {
    if let Ok(f) = File::create(name) {
      return SimpleDatabase {
        db_file: f,
        data: RwLock::new(SimpleDatabaseData::new()),
      };
    } else {
      panic!("failed to init db");
    }
  }

  fn from_file(file: File) -> Self {
    if let Ok(storage) = rmp_serde::from_read(&file) {
      return SimpleDatabase {
        db_file: file,
        data: RwLock::new(storage),
      };
    } else {
      panic!("failed to read db file")
    }
  }

  fn sync_to_file(&self) {
    let buf = rmp_serde::encode::to_vec::<SimpleDatabaseData>(&self.data.read().unwrap()).unwrap(); // are these unwraps okay
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
