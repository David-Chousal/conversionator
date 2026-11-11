import { createHash } from "node:crypto";
import { getDb } from "./mvp-db.mjs";

const headers = ["date", "campaignId", "campaign", "spendCents", "clicks", "engagements", "impressions", "conversions"];
const required = headers.slice(0, 6);
const sourceId = "src_csv_upload";
const maxRows = 10_000;

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

function parseCsv(text) {
  const records = [];
  let row = [], field = "", quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') { quoted = false; closed = true; }
      else field += char;
    } else if (char === '"' && field === "" && !closed) {
      quoted = true;
    } else if (char === "," || char === "\n" || char === "\r") {
      row.push(field);
      field = "";
      closed = false;
      if (char !== ",") {
        if (row.some((value) => value !== "")) records.push(row);
        row = [];
        if (char === "\r" && input[index + 1] === "\n") index += 1;
      }
    } else if (closed || char === '"') {
      throw new Error("Invalid CSV quoting");
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("Unclosed CSV quote");
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((value) => value !== "")) records.push(row);
  }
  return records;
}

export function parseMetricsCsv(text) {
  const records = parseCsv(text);
  if (records.length < 2) throw new Error("CSV needs a header and at least one data row");
  if (records.length - 1 > maxRows) throw new Error(`CSV may contain at most ${maxRows} data rows`);
  const heading = records.shift().map((value) => value.trim());
  if (new Set(heading).size !== heading.length || !required.every((name) => heading.includes(name)) ||
      heading.some((name) => !headers.includes(name))) throw new Error(`CSV headers must include ${required.join(", ")}`);
  const seen = new Set();
  return records.map((values, index) => {
    if (values.length !== heading.length) throw new Error(`Row ${index + 2} has the wrong number of columns`);
    const entry = Object.fromEntries(heading.map((name, column) => [name, values[column].trim()]));
    if (!validDate(entry.date) || !entry.campaignId || !entry.campaign) throw new Error(`Row ${index + 2} has an invalid date or campaign`);
    for (const name of headers.slice(3)) {
      const raw = entry[name] ?? (headers.indexOf(name) >= 6 ? "0" : "");
      if (!/^(0|[1-9]\d*)$/.test(raw) || !Number.isSafeInteger(Number(raw))) throw new Error(`Row ${index + 2} has an invalid ${name}`);
      entry[name] = Number(raw);
    }
    const key = `${entry.campaignId}\0${entry.date}`;
    if (seen.has(key)) throw new Error(`Row ${index + 2} duplicates a campaign and date`);
    seen.add(key);
    return entry;
  });
}

export function importMetricsCsv(text, db = getDb()) {
  const rows = parseMetricsCsv(text);
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT OR IGNORE INTO workspaces(id,name,currency) VALUES('ws_demo','COR Demo Workspace','USD')").run();
    db.prepare("INSERT OR IGNORE INTO data_sources(id,workspace_id,provider,name,external_account_id,status) VALUES(?,?,?,?,?,'connected')")
      .run(sourceId, "ws_demo", "csv", "CSV Upload", "csv-upload");
    const insertCampaign = db.prepare(`INSERT INTO campaigns(id,source_id,external_id,name) VALUES(?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name`);
    const insertMetric = db.prepare(`INSERT INTO daily_metrics(campaign_id,metric_date,spend_cents,clicks,engagements,impressions,conversions)
      VALUES(?,?,?,?,?,?,?) ON CONFLICT(campaign_id,metric_date) DO UPDATE SET
      spend_cents=excluded.spend_cents, clicks=excluded.clicks, engagements=excluded.engagements,
      impressions=excluded.impressions, conversions=excluded.conversions, updated_at=CURRENT_TIMESTAMP`);
    for (const row of rows) {
      const id = `camp_csv_${createHash("sha256").update(row.campaignId).digest("hex").slice(0, 16)}`;
      insertCampaign.run(id, sourceId, row.campaignId, row.campaign);
      insertMetric.run(id, row.date, row.spendCents, row.clicks, row.engagements, row.impressions, row.conversions);
    }
    const finishedAt = new Date().toISOString();
    db.prepare("UPDATE data_sources SET last_synced_at=?, status='connected', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(finishedAt, sourceId);
    const run = db.prepare("INSERT INTO sync_runs(source_id,started_at,finished_at,status,rows_imported) VALUES(?,?,?,'success',?)")
      .run(sourceId, finishedAt, finishedAt, rows.length);
    db.exec("COMMIT");
    return { sourceId, runId: Number(run.lastInsertRowid), rowsImported: rows.length };
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function csvCell(value) {
  const raw = String(value ?? "");
  const safe = /^[=+@\-\t\r]/.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function metricsToCsv(rows) {
  return `${headers.join(",")}\r\n${rows.map((row) => headers.map((name) => csvCell(row[name])).join(",")).join("\r\n")}${rows.length ? "\r\n" : ""}`;
}
