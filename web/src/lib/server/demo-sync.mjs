import { createHash } from "node:crypto";
import { DEMO_SOURCE_ID, getDb } from "./mvp-db.mjs";

const defaultUrl = "http://127.0.0.1:4001";

function validateRow(row) {
  if (!row || typeof row !== "object") throw new Error("Provider returned an invalid record");
  const { date, campaignId, campaign, spendCents, clicks, engagements, impressions, conversions } = row;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(`${date}T00:00:00Z`)) ||
      new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date ||
      typeof campaignId !== "string" || !campaignId ||
      typeof campaign !== "string" || !campaign ||
      ![spendCents, clicks, engagements, impressions, conversions].every((value) => Number.isSafeInteger(value) && value >= 0)) {
    throw new Error("Provider returned an invalid record");
  }
  return { date, campaignId, campaign, spendCents, clicks, engagements, impressions, conversions };
}

export async function syncDemoProvider({ db = getDb(), fetcher = fetch, baseUrl = process.env.COR_DEMO_SOURCE_URL || defaultUrl,
  upstreamKey = process.env.COR_DEMO_SOURCE_KEY || "demo-source-key" } = {}) {
  db.prepare("INSERT OR IGNORE INTO workspaces(id,name,currency) VALUES(?,?,?)")
    .run("ws_demo", "COR Demo Workspace", "USD");
  db.prepare("INSERT OR IGNORE INTO data_sources(id,workspace_id,provider,name,external_account_id,status) VALUES(?,?,?,?,?,?)")
    .run(DEMO_SOURCE_ID, "ws_demo", "demo-ads", "Demo Ads API", "demo-account-1", "connected");
  const startedAt = new Date().toISOString();
  const run = db.prepare("INSERT INTO sync_runs(source_id,started_at,status) VALUES(?,?,'running')")
    .run(DEMO_SOURCE_ID, startedAt);
  const runId = Number(run.lastInsertRowid);

  try {
    const response = await fetcher(new URL("/v1/metrics", baseUrl), {
      headers: { Authorization: `Bearer ${upstreamKey}` },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Demo provider returned HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload?.data) || payload.data.length > 10_000) throw new Error("Provider response must contain a data array of at most 10,000 records");
    const rows = payload.data.map(validateRow);
    const unique = new Set(rows.map((row) => `${row.campaignId}|${row.date}`));
    if (unique.size !== rows.length) throw new Error("Provider returned duplicate campaign/date records");

    db.exec("BEGIN IMMEDIATE");
    try {
      const upsertCampaign = db.prepare(`INSERT INTO campaigns(id,source_id,external_id,name,status) VALUES(?,?,?,?,'active')
        ON CONFLICT(id) DO UPDATE SET name=excluded.name`);
      const upsertMetric = db.prepare(`INSERT INTO daily_metrics(campaign_id,metric_date,spend_cents,clicks,engagements,impressions,conversions)
        VALUES(?,?,?,?,?,?,?) ON CONFLICT(campaign_id,metric_date) DO UPDATE SET
        spend_cents=excluded.spend_cents, clicks=excluded.clicks, engagements=excluded.engagements,
        impressions=excluded.impressions, conversions=excluded.conversions, updated_at=CURRENT_TIMESTAMP`);
      for (const row of rows) {
        const ids = { "spring-launch": "camp_spring", "brand-awareness": "camp_brand", retargeting: "camp_retarget" };
        const id = ids[row.campaignId] || `camp_demo_${createHash("sha256").update(row.campaignId).digest("hex").slice(0, 16)}`;
        upsertCampaign.run(id, DEMO_SOURCE_ID, row.campaignId, row.campaign);
        upsertMetric.run(id, row.date, row.spendCents, row.clicks, row.engagements, row.impressions, row.conversions);
      }
      const finishedAt = new Date().toISOString();
      db.prepare("UPDATE data_sources SET status='connected', last_synced_at=?, updated_at=CURRENT_TIMESTAMP WHERE id=?")
        .run(finishedAt, DEMO_SOURCE_ID);
      db.prepare("UPDATE sync_runs SET status='success', finished_at=?, rows_imported=? WHERE id=?")
        .run(finishedAt, rows.length, runId);
      db.exec("COMMIT");
      return { runId, sourceId: DEMO_SOURCE_ID, status: "success", rowsImported: rows.length, finishedAt };
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    db.prepare("UPDATE data_sources SET status='failed', updated_at=CURRENT_TIMESTAMP WHERE id=?")
      .run(DEMO_SOURCE_ID);
    db.prepare("UPDATE sync_runs SET status='failed', finished_at=?, error_message=? WHERE id=?")
      .run(new Date().toISOString(), message.slice(0, 500), runId);
    throw error;
  }
}
