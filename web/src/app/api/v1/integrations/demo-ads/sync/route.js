import { authorize } from "../../../../../../lib/server/mvp-api.mjs";
import { syncDemoProvider } from "../../../../../../lib/server/demo-sync.mjs";


export async function POST(request) {
  const denied = authorize(request, "write");
  if (denied) return denied;
  try {
    return Response.json(await syncDemoProvider());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Sync failed" }, { status: 502 });
  }
}
