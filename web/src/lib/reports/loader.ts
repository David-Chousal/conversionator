import { connection } from "next/server";
import { metricLabel } from "@/lib/analytics/metrics";
import type { AttributionSource, MetricKey } from "@/lib/analytics/types";
import { dataSource, platformInfo } from "@/lib/data";
import type { Platform } from "@/lib/data/types";
import { emptyReport } from "./rules";
import type { ReportContent, ReportInput } from "./types";
import { reportRows, type ReportRow } from "./view";

const METRICS: readonly MetricKey[] = ["spend", "leads", "cpl", "conversions", "cpa", "roas"];

export interface ReportsPageData {
  rows: ReportRow[];
  hasChannels: boolean;
}

/** Saved and scheduled reports. Request time only: next-send dates depend on the clock. */
export async function loadReportsPage(): Promise<ReportsPageData> {
  await connection();
  const [reports, context, workspace, user] = await Promise.all([dataSource.listReports(), dataSource.getReportContext(), dataSource.getWorkspace(), dataSource.getCurrentUser()]);
  return { rows: reportRows(reports, { ...context, weekStart: workspace.weekStart, actor: user }), hasChannels: context.available.length > 0 };
}

export interface ComposerData {
  reportId: string | null;
  initial: ReportInput;
  canEdit: boolean;
  channels: { platform: Platform; name: string }[];
  metrics: { key: MetricKey; label: string; needsCrm: boolean }[];
  source: AttributionSource;
  weekStart: "monday" | "sunday";
  today: string;
  preview: ReportContent | null;
}

/** The composer for a new report (null) or an existing one; null when the report doesn't exist. */
export async function loadComposer(reportId: string | null): Promise<ComposerData | null> {
  await connection();
  const [context, workspace, user, report] = await Promise.all([
    dataSource.getReportContext(), dataSource.getWorkspace(), dataSource.getCurrentUser(), reportId ? dataSource.getReport(reportId) : Promise.resolve(null),
  ]);
  if (reportId && !report) return null;
  const initial: ReportInput = report ?? emptyReport(context.source, context.available);
  const usable = initial.metrics.length > 0 && initial.platforms.some((platform) => context.available.includes(platform));
  return {
    reportId: report?.id ?? null,
    initial,
    canEdit: !report || report.ownerId === user.id || user.role === "admin",
    channels: context.available.map((platform) => ({ platform, name: platformInfo(platform).name })),
    metrics: METRICS.map((key) => ({ key, label: metricLabel(key, context.source), needsCrm: context.source === "platform" && (key === "leads" || key === "cpl") })),
    source: context.source,
    weekStart: workspace.weekStart,
    today: context.today,
    preview: usable ? await dataSource.getReportContent({ ...initial, platforms: initial.platforms.filter((platform) => context.available.includes(platform)) }) : null,
  };
}
