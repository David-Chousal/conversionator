pub struct App {}

impl App {
  pub fn new() -> Self {
    Self {}
  }

  pub fn run(&self) -> tokio::io::Result<()> {
    Ok(())
  }
}
