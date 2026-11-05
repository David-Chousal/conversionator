use backend::app::App;

#[tokio::main]
async fn main() -> tokio::io::Result<()> {
  App::new().run()
}
