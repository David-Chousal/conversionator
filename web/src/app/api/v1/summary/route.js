import { authorize, invalidQuery } from "../../../../lib/server/mvp-api.mjs";
import { getSummary, parseFilters } from "../../../../lib/server/mvp-db.mjs";


export function GET(request) {
  const denied = authorize(request);
  if (denied) return denied;
  try {
    return Response.json(getSummary(parseFilters(new URL(request.url))));
  } catch (error) {
    return invalidQuery(error);
  }
}
