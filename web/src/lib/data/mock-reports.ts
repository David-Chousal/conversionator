import { todayIn } from "@/lib/analytics/dates";
import type { AttributionSource } from "@/lib/analytics/types";
import { buildReportContent } from "@/lib/reports/content";
import type { ReportContent, ReportContext, ReportInput } from "@/lib/reports/types";
import { resolveWindow } from "@/lib/reports/window";
import { analyticsChannels, attributionContext, mockAnalytics } from "./mock-analytics";
import type { Connection, CrmConnection, Workspace } from "./types";

interface MockSources {
  connections: Connection[];
  crm: CrmConnection;
  workspace: Workspace;
}

export function mockReportContext(connections: Connection[], crm: CrmConnection, workspace: Workspace, now: number): ReportContext & { source: AttributionSource } {
  return {
    available: analyticsChannels(connections, workspace.timeZone, now).map((channel) => channel.platform),
    today: todayIn(workspace.timeZone, now),
    source: attributionContext(crm).source,
  };
}

/** Builds the report from the same analytics the board uses, scoped to the report's window and channels. */
export function mockReportContent(input: ReportInput, sources: MockSources, now: number): ReportContent {
  const { connections, crm, workspace } = sources;
  const today = todayIn(workspace.timeZone, now);
  const available = analyticsChannels(connections, workspace.timeZone, now).map((channel) => channel.platform);
  const filter = { ...resolveWindow(input.window, today), excluded: available.filter((platform) => !input.platforms.includes(platform)), campaignId: null };
  return buildReportContent(input, mockAnalytics(connections, crm, workspace, filter, now), today);
}
