use std::{net::SocketAddr, sync::Arc};

pub mod api;

mod app_config;
pub use app_config::AppConfig;
use chrono::TimeDelta;

use crate::{
  app::api::CorApi,
  auth_service::SimpleAuthService,
  database::{
    ExternalDataCacheRepository, SimpleDatabase, SourceConfigRepository, UserRepository,
  },
  external_source_adapter::SimpleApiAdapter,
  team_service::SimpleTeamService,
  token_service::SimpleTokenService,
  types::{ExternalDataCache, ExternalMetricRow, MetricsPayload, SourceConfig, User, UserRole},
};

pub struct App {
  config: AppConfig,
}

impl App {
  pub fn new(config: AppConfig) -> Self {
    Self { config }
  }

  pub async fn run(&self) -> tokio::io::Result<()> {
    let db = Arc::new(SimpleDatabase::new());
    let token_service =
      Arc::new(SimpleTokenService::new(TimeDelta::days(1)));
    let user_repository: Arc<dyn UserRepository + Send + Sync> = db.clone();
    let auth_service = Arc::new(SimpleAuthService::new(
      token_service.clone(),
      db.clone() as Arc<dyn UserRepository>,
    ));
    let team_service = Arc::new(SimpleTeamService::new(db.clone(), user_repository.clone()));
    let source_repository: Arc<dyn SourceConfigRepository + Send + Sync> = db.clone();
    let cache_repository: Arc<dyn ExternalDataCacheRepository + Send + Sync> = db.clone();
    // Seed the demo admin so login works against a fresh database. The login form's
    // "Work email" field is type="email", so the username must look like an email.
    let mut demo_user = User::get_dummy();
    demo_user.role = UserRole::Admin;
    demo_user.username = String::from("foo@cor.dev");
    demo_user.email = String::from("foo@cor.dev");
    auth_service.register(&demo_user);

    // Seed one demo source with a cached payload so the Connections page has a
    // connected source to sync (not another dead "Connect" link) and /metrics
    // has data before the first real sync. Clicking "Sync now" replaces these
    // canned rows with the live 90 from the demo provider.
    let now = chrono::Utc::now();
    let demo_source = SourceConfig {
      id: 1,
      name: String::from("Google Ads (demo)"),
      platform: String::from("google-ads"),
      url: String::from("http://127.0.0.1:4001/v1/metrics"),
      api_key: String::from("demo-source-key"),
      sync_interval_seconds: 300,
      last_synced_at: Some(now),
    };
    let demo_payload = MetricsPayload {
      data: vec![
        ExternalMetricRow {
          date: String::from("2026-09-01"), campaign_id: String::from("spring-launch"), campaign: String::from("Spring Launch"),
          spend_cents: 4500, clicks: 42, engagements: 10, impressions: 900, conversions: 3,
        },
        ExternalMetricRow {
          date: String::from("2026-09-02"), campaign_id: String::from("spring-launch"), campaign: String::from("Spring Launch"),
          spend_cents: 5000, clicks: 51, engagements: 12, impressions: 1100, conversions: 4,
        },
      ],
    };
    cache_repository.save_cache(&ExternalDataCache {
      source_id: demo_source.id,
      data: serde_json::to_string(&demo_payload).unwrap(),
      cached_at: now,
      expires_at: now + chrono::Duration::seconds(demo_source.sync_interval_seconds as i64),
    });
    source_repository.save(&demo_source);

    // Periodic external-source sync: every 30s, sync each source whose interval has elapsed
    // (the diagram's isSyncDue / updateSyncTimestamp story).
    let scheduler_sources = source_repository.clone();
    let scheduler_cache = cache_repository.clone();
    tokio::spawn(async move {
      let source_repository = scheduler_sources;
      let cache_repository = scheduler_cache;
      loop {
        tokio::time::sleep(std::time::Duration::from_secs(30)).await;
        for config in source_repository.get_all() {
          let adapter = SimpleApiAdapter::new(config.clone(), cache_repository.clone());
          if !adapter.sync_due() {
            continue;
          }
          match adapter.sync().await {
            Ok(rows) => {
              let mut updated = config.clone();
              updated.last_synced_at = Some(chrono::Utc::now());
              source_repository.save(&updated);
              println!("synced \"{}\": {rows} rows", updated.name);
            }
            Err(e) => eprintln!("sync failed for \"{}\": {e}", config.name),
          }
        }
      }
    });

    let api = CorApi::new(
      auth_service,
      token_service,
      user_repository,
      team_service,
      source_repository,
      cache_repository,
    );
    let sockaddr = (self.config.listen_addr, self.config.listen_port);
    api.serve(SocketAddr::from(sockaddr)).await?;
    Ok(())
  }
}
