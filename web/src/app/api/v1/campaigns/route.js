import { authorize } from "../../../../lib/server/mvp-api.mjs";
import { listCampaigns } from "../../../../lib/server/mvp-db.mjs";


export function GET(request) {
  const denied = authorize(request);
  if (denied) return denied;
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].some((key) => key !== "sourceId" || url.searchParams.getAll(key).length !== 1)) {
    return Response.json({ error: "Only one sourceId parameter is allowed" }, { status: 400 });
  }
  return Response.json({ data: listCampaigns(url.searchParams.get("sourceId")) });
}
