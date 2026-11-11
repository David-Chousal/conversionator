import { authorize } from "../../../../lib/server/mvp-api.mjs";
import { listSources } from "../../../../lib/server/mvp-db.mjs";


export function GET(request) {
  const denied = authorize(request);
  if (denied) return denied;
  return Response.json({ data: listSources() });
}
