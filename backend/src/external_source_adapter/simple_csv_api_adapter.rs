use std::sync::Arc;

use hyper::{Request, body::Body};

use crate::external_source_adapter::{
  ExternalSourceAdapter, LocalCache,
};

pub struct SimpleLocalCache {}

impl SimpleLocalCache {
  pub fn new() -> Self {
    Self {}
  }
}

impl LocalCache for SimpleLocalCache {}

pub struct SimpleCsvApiAdapter {
  url: reqwest::Url,
  local_cache: Arc<dyn LocalCache>,
}

impl SimpleCsvApiAdapter {
  pub fn new(uri: &reqwest::Url) -> Self {
    Self {
      url: uri.clone(),
      local_cache: Arc::new(SimpleLocalCache::new()),
    }
  }
}

impl ExternalSourceAdapter for SimpleCsvApiAdapter {
  async fn sync(&self) -> Result<(), &'static str> {
    let req = Request::builder().method("GET").body(()).unwrap();
    let client = reqwest::ClientBuilder::new().build().unwrap();
    let res = client
      .get(self.url.clone())
      .send()
      .await
      .map_err(|e| "error fetching remote url")?;

    Ok(())
  }

  fn status(&self) -> super::ExternalSourceStatus {
    todo!()
  }

  fn data_bytes(&self) -> Vec<u8> {
    todo!()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn foo() {
    ()
  }
}
