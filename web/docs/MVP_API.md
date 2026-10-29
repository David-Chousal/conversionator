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
| `GET /api/v1/summary` | Read key | Totals for spend, clicks, engagements, impressions, conversions |
| `GET /api/v1/sync-runs` | Read key | Import history and errors |
| `POST /api/v1/integrations/demo-ads/sync` | Write key | Pull the simulated provider into SQLite |

`metrics` and `summary` accept `from`, `to`, `sourceId`, and `campaignId`. `metrics` also accepts `limit` (1–500, default 100) and `offset` (default 0). Dates use `YYYY-MM-DD`. Money is stored as integer cents (`spendCents`); `spendUsd` is included for display. Summary totals cover all matching rows, independent of pagination.

Examples:

```sh
curl -H 'Authorization: Bearer YOUR_READ_KEY' 'http://localhost:3000/api/v1/sources'
curl -H 'Authorization: Bearer YOUR_READ_KEY' 'http://localhost:3000/api/v1/campaigns'
curl -H 'Authorization: Bearer YOUR_READ_KEY' 'http://localhost:3000/api/v1/summary?from=2026-09-01&to=2026-09-30'
```

A missing or invalid key returns HTTP 401. Invalid filters return HTTP 400. Generate a separate key for each teammate, and revoke a key by label with `node scripts/db.mjs revoke-key teammate-read`.

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
