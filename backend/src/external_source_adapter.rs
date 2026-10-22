pub struct ExternalSourceStatus;

pub trait ExternalSourceAdapter {
  fn sync(&self) -> Result<(), &'static str>;
  fn get_status(&self) -> ExternalSourceStatus;
  fn get_data_bytes(&self) -> Vec<u8>;
}
