import { DataSourceError, dataSource } from "@/lib/data";
import { reportCsv, reportFilename, reportPdf } from "@/lib/reports/export";
import { parseReportInput } from "@/lib/reports/parse";
import { checkPreviewable } from "@/lib/reports/check";

const MAX_BODY_BYTES = 16_384;

function failure(message: string, status: number): Response {
  return Response.json({ message }, { status });
}

/** Builds the report's file from the composer's current settings and sends it as a download. */
export async function POST(request: Request): Promise<Response> {
  const body = await request.text();
  if (body.length > MAX_BODY_BYTES) return failure("That report is too large to export.", 413);
  try {
    const input = parseReportInput(JSON.parse(body));
    await checkPreviewable(input);
    const content = await dataSource.getReportContent(input);
    if (content.empty) return failure(`No data for ${content.windowLabel} on ${content.channelNames.join(", ") || "those channels"}. Pick a wider window or more channels.`, 422);
    const file = input.format === "csv" ? reportCsv(content) : new Uint8Array(await reportPdf(content));
    const type = input.format === "csv" ? "text/csv; charset=utf-8" : "application/pdf";
    return new Response(file, { headers: { "Content-Type": type, "Content-Disposition": `attachment; filename="${reportFilename(content, input.format)}"`, "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SyntaxError) return failure("The export request wasn't readable. Try again.", 400);
    if (error instanceof DataSourceError) return failure(error.message, 422);
    console.error("Report export failed", error);
    return failure("Something went wrong building the file. Try again in a moment.", 500);
  }
}
