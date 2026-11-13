use std::sync::Arc;

use hyper::Method;
use reqwest::{Request, RequestBuilder};

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
    let client = reqwest::ClientBuilder::new().build().unwrap();
    let req = client
      .request(Method::GET, self.url.clone())
      .build()
      .unwrap();
    let _res = client
      .execute(req)
      .await
      .map_err(|_e| "error fetching remote url")?;

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
