import { DataSourceError, dataSource } from "@/lib/data";
import { validateReport } from "./rules";
import type { ReportInput } from "./types";

/** Checks what the preview and export need (metrics, channels, window) and throws the first problem as a message. */
export async function checkPreviewable(input: ReportInput): Promise<void> {
  const context = await dataSource.getReportContext();
  const { metrics, platforms, window } = validateReport(input, context);
  const problem = metrics ?? platforms ?? window;
  if (problem) throw new DataSourceError("invalid_input", problem);
}
