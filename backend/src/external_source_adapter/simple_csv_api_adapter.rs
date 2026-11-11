use hyper::{Request, body::Body};

use crate::external_source_adapter::ExternalSourceAdapter;

pub struct SimpleCsvApiAdapter {
  url: reqwest::Url,
}

impl SimpleCsvApiAdapter {
  pub fn new(uri: &reqwest::Url) -> Self {
    Self { url: uri.clone() }
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
      .map_err(|e| format!("error fetching remote url: {e}"))?;

    // let conn = hyper::client::conn::http1::Builder::new().handshake()

    Ok(())
  }

  fn status(&self) -> super::ExternalSourceStatus {
    todo!()
  }

  fn data_bytes(&self) -> Vec<u8> {
    todo!()
  }
}
