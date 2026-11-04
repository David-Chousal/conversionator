pub trait Component {
  fn init(&self) {}
  fn periodic(&self) {}
  fn cleanup(&self) {}
}
