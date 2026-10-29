import { createApiKey, getDb, seedDemo } from "../src/lib/server/mvp-db.mjs";

const [command, label, option] = process.argv.slice(2);
const db = getDb();

if (command === "setup") {
  seedDemo(db);
  console.log("SQLite database ready with 3 campaigns and 90 daily metric records.");
  console.log(`Database: ${process.env.COR_DB_PATH || `${process.cwd()}/data/cor-mvp.sqlite3`}`);
} else if (command === "create-key") {
  if (!label) throw new Error("Usage: npm run db:key -- create-key <label> [--write]");
  const scopes = option === "--write" ? "read,write" : "read";
  const key = createApiKey(label, scopes, db);
  console.log(`${label} (${scopes}) API key; copy it now, it will not be shown again:\n${key}`);
} else if (command === "revoke-key") {
  if (!label) throw new Error("Usage: npm run db:key -- revoke-key <label>");
  const result = db.prepare("UPDATE api_keys SET revoked_at=CURRENT_TIMESTAMP WHERE label=? AND revoked_at IS NULL").run(label);
  console.log(result.changes ? `Revoked ${label}` : `No active key named ${label}`);
} else if (command === "status") {
  for (const table of ["workspaces", "data_sources", "campaigns", "daily_metrics", "api_keys", "sync_runs"]) {
    console.log(`${table}: ${db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count}`);
  }
} else {
  console.error("Usage: node scripts/db.mjs setup | create-key <label> [--write] | revoke-key <label> | status");
  process.exitCode = 1;
}
