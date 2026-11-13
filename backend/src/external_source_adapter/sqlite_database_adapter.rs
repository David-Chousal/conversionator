use std::path::Path;

pub struct SQLiteDatabaseAdapter {
  conn: sqlite::ConnectionThreadSafe,
}

impl SQLiteDatabaseAdapter {
  pub fn from_path<P: AsRef<Path>>(
    path: P,
  ) -> Result<Self, sqlite::Error> {
    let conn = sqlite::Connection::open_thread_safe(path)?;
    Ok(Self { conn })
  }
}
