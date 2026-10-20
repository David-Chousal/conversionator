"use server";

import { refresh } from "next/cache";
import { runAsUser, type ActionResult } from "@/lib/actions/admin";
import { dataSource } from "@/lib/data";
import { checkPreviewable } from "@/lib/reports/check";
import { parseReportInput } from "@/lib/reports/parse";
import type { Report, ReportContent } from "@/lib/reports/types";

export async function previewReportAction(input: unknown): Promise<ActionResult<ReportContent>> {
  return runAsUser(async () => {
    const parsed = parseReportInput(input);
    await checkPreviewable(parsed);
    return dataSource.getReportContent(parsed);
  });
}

export async function saveReportAction(reportId: string | null, input: unknown): Promise<ActionResult<Report>> {
  const result = await runAsUser(() => dataSource.saveReport(typeof reportId === "string" ? reportId : null, parseReportInput(input)));
  refresh();
  return result;
}

export async function deleteReportAction(reportId: string): Promise<ActionResult<null>> {
  const result = await runAsUser(async () => {
    await dataSource.deleteReport(String(reportId));
    return null;
  });
  refresh();
  return result;
}
