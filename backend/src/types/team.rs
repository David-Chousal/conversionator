use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Team {
  pub id: u128,
  pub name: String,
  pub description: String,
  pub owner_id: u128,
  pub created_at: DateTime<Utc>,
}
