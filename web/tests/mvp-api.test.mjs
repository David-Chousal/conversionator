import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

process.env.COR_DB_PATH = path.join(mkdtempSync(path.join(tmpdir(), "cor-mvp-test-")), "test.sqlite3");

const { createApiKey, getDb, seedDemo, getSummary, keyHasScope, parseFilters } = await import("../src/lib/server/mvp-db.mjs");
const metricsRoute = await import("../src/app/api/v1/metrics/route.js");
const summaryRoute = await import("../src/app/api/v1/summary/route.js");
const syncRoute = await import("../src/app/api/v1/integrations/demo-ads/sync/route.js");
const { syncDemoProvider } = await import("../src/lib/server/demo-sync.mjs");

const db = getDb();
seedDemo(db);
const readKey = createApiKey("test-reader", "read", db);
const writeKey = createApiKey("test-writer", "read,write", db);
const request = (url, key, method = "GET") => new Request(url, {
  method, headers: key ? { Authorization: `Bearer ${key}` } : {},
});

test("seeded database contains connected records and can be set up twice", () => {
  seedDemo(db);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM campaigns").get().n, 3);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM daily_metrics").get().n, 90);
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
});

test("read key returns paged, filterable metrics and summary", async () => {
  const url = "http://localhost/api/v1/metrics?from=2026-09-01&to=2026-09-07&campaignId=camp_spring";
  const response = metricsRoute.GET(request(url, readKey));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.total, 7);
  assert.equal(result.data.length, 7);
  assert.equal(result.data[0].spendUsd, 45);
  const summary = await summaryRoute.GET(request(url.replace("/metrics?", "/summary?"), readKey)).json();
  assert.equal(summary.records, 7);
  assert.equal(summary.clicks, result.data.reduce((sum, row) => sum + row.clicks, 0));
});

test("API rejects missing or invalid keys and invalid dates", async () => {
  assert.equal(keyHasScope(readKey, "write", db), false);
  assert.equal(keyHasScope(writeKey, "write", db), true);
  assert.equal(metricsRoute.GET(request("http://localhost/api/v1/metrics")).status, 401);
  assert.equal(metricsRoute.GET(request("http://localhost/api/v1/metrics", "wrong")).status, 401);
  assert.equal(metricsRoute.GET(request("http://localhost/api/v1/metrics?from=2026-02-30", readKey)).status, 400);
  assert.equal(metricsRoute.GET(request("http://localhost/api/v1/metrics?limit=501", readKey)).status, 400);
  assert.equal((await syncRoute.POST(request("http://localhost/api/v1/integrations/demo-ads/sync", readKey, "POST"))).status, 401);
});

test("provider sync updates database records and records the run", async () => {
  const data = [{ date: "2026-09-01", campaignId: "spring-launch", campaign: "Spring Launch",
    spendCents: 9999, clicks: 42, engagements: 65, impressions: 3000, conversions: 3 }];
  const fetcher = async () => Response.json({ data });
  const result = await syncDemoProvider({ db, fetcher });
  assert.equal(result.rowsImported, 1);
  assert.equal(getSummary(parseFilters(new URL("http://localhost?from=2026-09-01&to=2026-09-01&campaignId=camp_spring")), db).spendCents, 9999);
  assert.equal(db.prepare("SELECT status FROM sync_runs WHERE id=?").get(result.runId).status, "success");
});

test("failed provider sync leaves saved metrics intact and logs failure", async () => {
  const before = db.prepare("SELECT spend_cents FROM daily_metrics WHERE campaign_id='camp_spring' AND metric_date='2026-09-01'").get().spend_cents;
  await assert.rejects(syncDemoProvider({ db, fetcher: async () => new Response("", { status: 503 }) }));
  const after = db.prepare("SELECT spend_cents FROM daily_metrics WHERE campaign_id='camp_spring' AND metric_date='2026-09-01'").get().spend_cents;
  assert.equal(after, before);
  assert.equal(db.prepare("SELECT status FROM sync_runs ORDER BY id DESC LIMIT 1").get().status, "failed");
});
