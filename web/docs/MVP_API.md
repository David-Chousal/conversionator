# COR MVP database and API

This demo uses a local SQLite database and a simulated ad provider. It contains campaign-level daily ad spend, clicks, and engagements, plus impressions and conversions. It does not use Meta data or Meta credentials.

## Start the API

Use Node.js 22.13 or newer. From `web/`:

```sh
npm install
node scripts/db.mjs setup
node scripts/db.mjs create-key teammate-read
npm run dev
```

The current `package-lock.json` on `main` is out of sync with `package.json`, so `npm ci` fails before it reaches this integration. `npm install` may update the lock file. Have the team review and commit that lock-file correction in a separate change if reproducible installs are needed.

Save the key printed by `create-key`; it is displayed once. The API is under `http://localhost:3000/api/v1`. The seed creates one workspace, one demo source, three campaigns, and 90 daily metric records for September 2026. Repeating `setup` preserves existing records.

If the team hosts one shared API, run the Next.js server on a host with a persistent writable disk and an HTTPS URL. Each teammate's `localhost` points to their own computer. Set `COR_DB_PATH` to an absolute path on the host to place the SQLite file on that persistent disk. A serverless deployment with an ephemeral filesystem will lose keys and imported data.

## Pull data

Send the key as a Bearer token. Example:

```sh
curl -H 'Authorization: Bearer YOUR_READ_KEY' 'http://localhost:3000/api/v1/metrics?from=2026-09-01&to=2026-09-30&limit=10'
```

| Endpoint | Access | Result |
| --- | --- | --- |
| `GET /api/v1/health` | Public | Live SQLite availability |
| `GET /api/v1/sources` | Read key | Connected data sources |
| `GET /api/v1/campaigns` | Read key | Campaigns; optional `sourceId` |
| `GET /api/v1/metrics` | Read key | Daily rows and pagination |
| `GET /api/v1/metrics/csv` | Read key | Matching daily rows as downloadable CSV |
| `POST /api/v1/metrics/csv` | Write key | Validate and import CSV rows |
| `GET /api/v1/summary` | Read key | Totals for spend, clicks, engagements, impressions, conversions |
| `GET /api/v1/sync-runs` | Read key | Import history and errors |
| `POST /api/v1/integrations/demo-ads/sync` | Write key | Pull the simulated provider into SQLite |

`metrics` and `summary` accept `from`, `to`, `sourceId`, and `campaignId`. `metrics` also accepts `limit` (1–500, default 100) and `offset` (default 0). Dates use `YYYY-MM-DD`. Money is stored as integer cents (`spendCents`); `spendUsd` is included for display. Summary totals cover all matching rows, independent of pagination.

The CSV download accepts the same filters and pagination as `metrics`. It returns at most 500 rows per request, with `X-Total-Count`, `X-Limit`, and `X-Offset` response headers. Request the next page with a larger `offset` until all rows are read. Its columns are `date,campaignId,campaign,spendCents,clicks,engagements,impressions,conversions`.

Examples:

```sh
curl -H 'Authorization: Bearer YOUR_READ_KEY' 'http://localhost:3000/api/v1/sources'
curl -H 'Authorization: Bearer YOUR_READ_KEY' 'http://localhost:3000/api/v1/campaigns'
curl -H 'Authorization: Bearer YOUR_READ_KEY' 'http://localhost:3000/api/v1/summary?from=2026-09-01&to=2026-09-30'
```

A missing or invalid key returns HTTP 401. Invalid filters return HTTP 400. Generate a separate key for each teammate, and revoke a key by label with `node scripts/db.mjs revoke-key teammate-read`.

## Upload and download CSV

The [sample CSV](./sample-metrics.csv) can be imported with a write key. From `web/`:

```sh
node scripts/db.mjs create-key csv-importer --write
curl -X POST 'http://localhost:3000/api/v1/metrics/csv' \
  -H 'Authorization: Bearer YOUR_WRITE_KEY' \
  -H 'Content-Type: text/csv' \
  --data-binary @docs/sample-metrics.csv
```

The required columns are `date,campaignId,campaign,spendCents,clicks,engagements`. Optional `impressions` and `conversions` default to zero. Spend is in cents, so `12500` means $125.00. The CSV must be UTF-8, at most 1 MB, and contain no more than 10,000 data rows. A repeated campaign/date updates that record. An invalid file returns HTTP 400 without importing any rows. Uploaded campaigns appear under the `src_csv_upload` data source; successful uploads appear in `/api/v1/sync-runs`.

```sh
curl -H 'Authorization: Bearer YOUR_READ_KEY' \
  'http://localhost:3000/api/v1/metrics/csv?sourceId=src_csv_upload&limit=500&offset=0' \
  -o metrics.csv
```

The CSV download is intended as a data feed. Importing an exported file back into the same database creates records under the CSV Upload source, so it is not a full database backup.

## Connect the COR app

Keep the API key on the server. Set `COR_API_BASE_URL` to the API host (for local development, `http://127.0.0.1:3000`) and `COR_API_KEY` to a read key in the app server's environment. Do not put the key in a `NEXT_PUBLIC_` variable or browser code. A server-side loader can call the JSON endpoint like this:

```ts
const response = await fetch(
  `${process.env.COR_API_BASE_URL}/api/v1/metrics?from=2026-09-01&limit=100`,
  { headers: { Authorization: `Bearer ${process.env.COR_API_KEY}` }, cache: "no-store" },
);
if (!response.ok) throw new Error(`COR API returned ${response.status}`);
const { data, total } = await response.json();
```

For a CSV feed, call `/api/v1/metrics/csv` from the same server-side code and use `await response.text()` instead of `response.json()`. To upload, send `POST` with `Content-Type: text/csv`, a write key, and the CSV text as the body. The current COR pages still use their existing mock loader; a teammate can replace the relevant page loader with this server-side call. If the UI and API run in the same Next.js process, the server can also read through the database module directly.

## Can another person connect while the database is local?

Yes, if they can reach the **API server** on the computer hosting SQLite. They do not connect directly to the `.sqlite3` file. `localhost` from a teammate's computer refers to their computer, so they must use the host computer's LAN IP or a deployed HTTPS domain. For a same-network demo, start Next.js with `npm run dev -- --hostname 0.0.0.0`, allow the port through the host firewall, and give teammates `http://HOST_LAN_IP:3000` plus individual read keys. For access outside that network, deploy the API on a reachable host with persistent storage and HTTPS. Keep the SQLite file on that host, set `COR_DB_PATH` there, and issue keys on that same host. A local database alone does not make the endpoint reachable over the internet.

## Demonstrate an external API import

In another terminal, from `web/`, start the simulated upstream service:

```sh
node scripts/demo-provider.mjs
```

Create a write key, then trigger the import:

```sh
node scripts/db.mjs create-key demo-importer --write
curl -X POST -H 'Authorization: Bearer YOUR_WRITE_KEY' 'http://localhost:3000/api/v1/integrations/demo-ads/sync'
```

The importer calls `http://127.0.0.1:4001/v1/metrics` with the upstream key, validates the response, and updates the database in one transaction. By default the provider and importer both use `demo-source-key`. Set `COR_DEMO_SOURCE_URL` and `COR_DEMO_SOURCE_KEY` on the Next.js server if the upstream service runs elsewhere or uses a different key. `DEMO_SPEND_MULTIPLIER=2 node scripts/demo-provider.mjs` lets you show spend changing after a second import. Query `/api/v1/summary` and `/api/v1/sync-runs` to see the result. Existing metrics survive a failed import.

## Database and checks

Open `web/data/cor-mvp.sqlite3` as a SQLite connection in DBeaver. The schema is in `web/database/schema.sql`. API keys are stored as SHA-256 hashes; the readable key is not stored. Run `node scripts/db.mjs status` for table counts and `node --test tests/mvp-api.test.mjs` for the integration tests.

The current COR pages still read their existing mock data source. These new endpoints are the database-backed path for teammates to call from the MVP. To show imported data in an existing page, a teammate can replace that page's data loader with calls to these endpoints or to the database module on the server.

## Existing-file changes for the team to consider

No existing application files were changed for this handoff. If the team wants shorthand commands, add `db:setup`, `db:key`, `db:status`, `demo:provider`, and `test:mvp` scripts to `web/package.json` that invoke the commands above. Add `/data/*.sqlite3*` to `web/.gitignore` if preferred; `web/data/.gitignore` already prevents the local database from being committed. The existing `next/font/google` dependency in `web/src/app/layout.tsx` needs network access during `npm run build`; a team member can self-host that font or use a local fallback for offline builds. For remote teammates, deploy the Next.js server with persistent storage, set the shared base URL, and issue separate keys.
