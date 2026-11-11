import { authorize } from "../../../../lib/server/mvp-api.mjs";
import { getDb } from "../../../../lib/server/mvp-db.mjs";


export function GET(request) {
  const denied = authorize(request);
  if (denied) return denied;
  const data = getDb().prepare(`SELECT id, source_id AS sourceId, started_at AS startedAt,
    finished_at AS finishedAt, status, rows_imported AS rowsImported, error_message AS errorMessage
    FROM sync_runs ORDER BY id DESC LIMIT 25`).all();
  return Response.json({ data });
}
