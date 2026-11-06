use axum::{Router, routing::get};

mod app_config;
pub use app_config::AppConfig;

pub struct App {
  config: AppConfig,
}

impl App {
  pub fn new(config: AppConfig) -> Self {
    Self { config }
  }

  pub async fn run(&self) -> tokio::io::Result<()> {
    let full = (self.config.listen_addr, self.config.listen_port);
    let listener = tokio::net::TcpListener::bind(full).await?;
    let router =
      Router::new().route("/", get(|| async { "Hello world!" }));
    axum::serve(listener, router).await?;
    Ok(())
  }
}
