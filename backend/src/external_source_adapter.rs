mod simple_csv_api_adapter;

pub use simple_csv_api_adapter::SimpleCsvApiAdapter;

pub struct ExternalSourceStatus;

pub trait ExternalSourceAdapter {
  async fn sync(&self) -> Result<(), &'static str>;
  fn status(&self) -> ExternalSourceStatus;
  fn data_bytes(&self) -> Vec<u8>;
}
