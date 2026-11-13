mod simple_csv_api_adapter;
mod sqlite_database_adapter;

pub use simple_csv_api_adapter::SimpleCsvApiAdapter;
pub use sqlite_database_adapter::SQLiteDatabaseAdapter;

pub struct ExternalSourceStatus;

pub trait ExternalSourceAdapter {
  async fn sync(&self) -> Result<(), &'static str>;
  fn status(&self) -> ExternalSourceStatus;
  fn data_bytes(&self) -> Vec<u8>;
}

pub trait LocalCache {}
