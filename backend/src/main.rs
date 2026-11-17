use backend::app::{App, AppConfig};
use std::{
  net::{IpAddr, Ipv6Addr},
  str::FromStr,
};

#[tokio::main]
async fn main() -> tokio::io::Result<()> {
  let config = AppConfig {
    listen_addr: IpAddr::V6(Ipv6Addr::from_str("::1").unwrap()),
    listen_port: 8000,
  };
  App::new(config).run().await
}
