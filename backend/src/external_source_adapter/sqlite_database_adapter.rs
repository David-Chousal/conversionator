use std::path::Path;

use crate::external_source_adapter::ExternalSourceAdapter;

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

impl ExternalSourceAdapter for SQLiteDatabaseAdapter {
  async fn sync(&self) -> Result<(), &'static str> {
    todo!()
  }

  fn status(&self) -> super::ExternalSourceStatus {
    todo!()
  }

  fn data_bytes(&self) -> Vec<u8> {
    todo!()
  }
}
