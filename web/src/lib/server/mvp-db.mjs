import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const workspaceId = "ws_demo";
const sourceId = "src_demo_ads";
const campaigns = [
  { id: "camp_spring", externalId: "spring-launch", name: "Spring Launch" },
  { id: "camp_brand", externalId: "brand-awareness", name: "Brand Awareness" },
  { id: "camp_retarget", externalId: "retargeting", name: "Retargeting" },
];

let cachedDb;

export function databasePath() {
  return process.env.COR_DB_PATH || path.join(process.cwd(), "data", "cor-mvp.sqlite3");
}

export function openDb(file = databasePath()) {
  if (file !== ":memory:") mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
  db.exec(readFileSync(path.join(process.cwd(), "database", "schema.sql"), "utf8"));
  return db;
}

export function getDb() {
  cachedDb ??= openDb();
  return cachedDb;
}

export function seedDemo(db = getDb()) {
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT OR IGNORE INTO workspaces(id,name,currency) VALUES(?,?,?)").run(workspaceId, "COR Demo Workspace", "USD");
    db.prepare("INSERT OR IGNORE INTO data_sources(id,workspace_id,provider,name,external_account_id,status) VALUES(?,?,?,?,?,?)")
      .run(sourceId, workspaceId, "demo-ads", "Demo Ads API", "demo-account-1", "connected");
    const insertCampaign = db.prepare("INSERT OR IGNORE INTO campaigns(id,source_id,external_id,name) VALUES(?,?,?,?)");
    const insertMetric = db.prepare("INSERT OR IGNORE INTO daily_metrics(campaign_id,metric_date,spend_cents,clicks,engagements,impressions,conversions) VALUES(?,?,?,?,?,?,?)");
    for (let index = 0; index < campaigns.length; index += 1) {
      const campaign = campaigns[index];
      insertCampaign.run(campaign.id, sourceId, campaign.externalId, campaign.name);
      for (let day = 0; day < 30; day += 1) {
        const metricDate = `2026-09-${String(day + 1).padStart(2, "0")}`;
        insertMetric.run(campaign.id, metricDate, 4500 + index * 2900 + (day * 137 + index * 83) % 2100,
          42 + index * 25 + (day * 7 + index * 3) % 38,
          65 + index * 31 + (day * 11 + index * 5) % 56,
          3000 + index * 1500 + day * 31, 3 + index + day % 4);
      }
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function createApiKey(label, scopes = "read", db = getDb()) {
  if (!label || !["read", "read,write"].includes(scopes)) throw new Error("Label and valid scopes are required");
  const key = `cor_mvp_${randomBytes(32).toString("base64url")}`;
  db.prepare("INSERT INTO api_keys(label,key_hash,scopes) VALUES(?,?,?)")
    .run(label, createHash("sha256").update(key).digest("hex"), scopes);
  return key;
}

export function keyHasScope(key, scope, db = getDb()) {
  if (!key?.startsWith("cor_mvp_")) return false;
  const hash = createHash("sha256").update(key).digest("hex");
  const record = db.prepare("SELECT scopes FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL").get(hash);
  return Boolean(record && record.scopes.split(",").includes(scope));
}

export function listSources(db = getDb()) {
  return db.prepare(`SELECT id, provider, name, external_account_id AS externalAccountId,
    status, last_synced_at AS lastSyncedAt FROM data_sources ORDER BY name`).all();
}

export function listCampaigns(sourceIdFilter, db = getDb()) {
  const where = sourceIdFilter ? "WHERE c.source_id = ?" : "";
  return db.prepare(`SELECT c.id, c.source_id AS sourceId, c.external_id AS externalId,
    c.name, c.status FROM campaigns c ${where} ORDER BY c.name`)
    .all(...(sourceIdFilter ? [sourceIdFilter] : []));
}

export function parseFilters(url) {
  const allowed = new Set(["from", "to", "sourceId", "campaignId", "limit", "offset"]);
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key) || url.searchParams.getAll(key).length !== 1) throw new Error(`Invalid query parameter: ${key}`);
  }
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  for (const value of [from, to]) {
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
      new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value)) {
      throw new Error("Dates must be valid YYYY-MM-DD values");
    }
  }
  if (from && to && from > to) throw new Error("from must be on or before to");
  const integer = (name, fallback, max) => {
    const raw = url.searchParams.get(name);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw) || Number(raw) > max || (name === "limit" && Number(raw) < 1)) throw new Error(`Invalid ${name}`);
    return Number(raw);
  };
  return { from, to, sourceId: url.searchParams.get("sourceId"), campaignId: url.searchParams.get("campaignId"),
    limit: integer("limit", 100, 500), offset: integer("offset", 0, 1_000_000) };
}

function whereClause(filters) {
  const clauses = [];
  const params = [];
  for (const [value, expression] of [[filters.from, "m.metric_date >= ?"], [filters.to, "m.metric_date <= ?"],
    [filters.sourceId, "c.source_id = ?"], [filters.campaignId, "c.id = ?"]]) {
    if (value) { clauses.push(expression); params.push(value); }
  }
  return { sql: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
}

const metricFrom = `FROM daily_metrics m JOIN campaigns c ON c.id = m.campaign_id
  JOIN data_sources s ON s.id = c.source_id`;

export function listMetrics(filters, db = getDb()) {
  const { sql, params } = whereClause(filters);
  const total = db.prepare(`SELECT COUNT(*) AS count ${metricFrom}${sql}`).get(...params).count;
  const rows = db.prepare(`SELECT m.metric_date AS date, c.id AS campaignId, c.name AS campaign,
    s.id AS sourceId, s.name AS source, m.spend_cents AS spendCents,
    m.clicks, m.engagements, m.impressions, m.conversions
    ${metricFrom}${sql} ORDER BY m.metric_date, c.id LIMIT ? OFFSET ?`)
    .all(...params, filters.limit, filters.offset)
    .map((row) => ({ ...row, spendUsd: row.spendCents / 100 }));
  return { data: rows, total, limit: filters.limit, offset: filters.offset };
}

export function getSummary(filters, db = getDb()) {
  const { sql, params } = whereClause(filters);
  const row = db.prepare(`SELECT COUNT(*) AS records,
    COALESCE(SUM(m.spend_cents),0) AS spendCents,
    COALESCE(SUM(m.clicks),0) AS clicks,
    COALESCE(SUM(m.engagements),0) AS engagements,
    COALESCE(SUM(m.impressions),0) AS impressions,
    COALESCE(SUM(m.conversions),0) AS conversions
    ${metricFrom}${sql}`).get(...params);
  return { ...row, spendUsd: row.spendCents / 100 };
}

export const DEMO_SOURCE_ID = sourceId;
