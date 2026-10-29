import { authorize, invalidQuery } from "../../../../lib/server/mvp-api.mjs";
import { listMetrics, parseFilters } from "../../../../lib/server/mvp-db.mjs";


export function GET(request) {
  const denied = authorize(request);
  if (denied) return denied;
  try {
    return Response.json(listMetrics(parseFilters(new URL(request.url))));
  } catch (error) {
    return invalidQuery(error);
  }
}
