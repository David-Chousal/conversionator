import { authorize, invalidQuery } from "../../../../../lib/server/mvp-api.mjs";
import { listMetrics, parseFilters } from "../../../../../lib/server/mvp-db.mjs";
import { importMetricsCsv, metricsToCsv } from "../../../../../lib/server/csv-metrics.mjs";

export function GET(request) {
  const denied = authorize(request);
  if (denied) return denied;
  try {
    const { data, total, limit, offset } = listMetrics(parseFilters(new URL(request.url)));
    return new Response(metricsToCsv(data), { headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="cor-metrics.csv"',
      "Cache-Control": "no-store",
      "X-Total-Count": String(total),
      "X-Limit": String(limit),
      "X-Offset": String(offset),
    } });
  } catch (error) { return invalidQuery(error); }
}

export async function POST(request) {
  const denied = authorize(request, "write");
  if (denied) return denied;
  if (!/^text\/csv(?:\s*;|$)/i.test(request.headers.get("content-type") || ""))
    return Response.json({ error: "Content-Type must be text/csv" }, { status: 415 });
  if (Number(request.headers.get("content-length")) > 1_000_000)
    return Response.json({ error: "CSV must be 1 MB or smaller" }, { status: 413 });
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > 1_000_000) return Response.json({ error: "CSV must be 1 MB or smaller" }, { status: 413 });
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return Response.json(importMetricsCsv(text), { status: 201 });
  } catch (error) { return invalidQuery(error); }
}
