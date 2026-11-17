use crate::types::{ExternalDataCache, SourceConfig};

/// The diagram's IExternalDataCacheRepository: cached external payloads per source.
pub trait ExternalDataCacheRepository: Send + Sync {
  /// Saves the cache entry; returns the *replaced* previous entry (None = new).
  fn save_cache(&self, cache: &ExternalDataCache) -> Option<ExternalDataCache>;
  fn get_cache(&self, source_id: u128) -> Option<ExternalDataCache>;
  /// Removes cached data stored from a source (the diagram's deleteExpired).
  fn delete_cache(&self, source_id: u128);
}

/// Where source configurations live. Beyond the diagram — it never says where
/// ExternalDataSource configs are stored — but the /sources API needs it.
pub trait SourceConfigRepository: Send + Sync {
  fn get_all(&self) -> Vec<SourceConfig>;
  /// Saves the config; returns the *replaced* previous entry (None = new).
  fn save(&self, source: &SourceConfig) -> Option<SourceConfig>;
  fn get_by_id(&self, id: u128) -> Option<SourceConfig>;
  fn delete_by_id(&self, id: u128) -> Option<SourceConfig>;
}
