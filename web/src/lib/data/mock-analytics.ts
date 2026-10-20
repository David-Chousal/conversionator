import { todayIn } from "@/lib/analytics/dates";
import { generateMockHistory } from "@/lib/analytics/mock-history";
import { addDays } from "@/lib/analytics/dates";
import { EMPTY_TOTALS, addTotals } from "@/lib/analytics/metrics";
import { buildReport, resolveRows } from "@/lib/analytics/report";
import type { AnalyticsFilter, AnalyticsReport, AttributionContext, CampaignInfo, ChannelInput } from "@/lib/analytics/types";
import { signalFor } from "./sync";
import type { AlertDay, AlertSeries } from "./settings-types";
import type { Connection, CrmConnection, Workspace } from "./types";

/** Connected channels that have finished at least one sync, with the last day their data covers. */
export function analyticsChannels(connections: Connection[], timeZone: string, now: number): ChannelInput[] {
  return connections
    .filter((connection) => (connection.status === "connected" || connection.status === "failed") && connection.lastSyncedAt)
    .map((connection) => ({
      platform: connection.platform,
      name: connection.name,
      channelCode: connection.channelCode,
      signal: signalFor(connection, now),
      dataThrough: todayIn(timeZone, Date.parse(connection.lastSyncedAt as string)),
    }));
}

/** HubSpot attributes outcomes once it has finished a sync; until then numbers are platform-reported. */
export function attributionContext(crm: CrmConnection): AttributionContext {
  const usable = crm.lastSyncedAt !== null && (crm.status === "connected" || crm.status === "failed");
  return usable
    ? { source: "crm", crmName: crm.name, leadStage: crm.leadStage, crmStatus: crm.status }
    : { source: "platform", crmName: null, leadStage: null, crmStatus: crm.status };
}

export function mockCampaigns(connections: Connection[], workspace: Workspace, now: number): CampaignInfo[] {
  const channels = analyticsChannels(connections, workspace.timeZone, now);
  return generateMockHistory(todayIn(workspace.timeZone, now), channels, "lead").campaigns;
}

export function mockAnalytics(connections: Connection[], crm: CrmConnection, workspace: Workspace, filter: AnalyticsFilter, now: number): AnalyticsReport {
  const today = todayIn(workspace.timeZone, now);
  const channels = analyticsChannels(connections, workspace.timeZone, now);
  const attribution = attributionContext(crm);
  const { rows, campaigns, ads, unattributed } = generateMockHistory(today, channels, crm.leadStage);
  return buildReport({ rows, campaigns, ads, unattributed, attribution, channels, filter, today, currency: workspace.currency });
}

const ALERT_SERIES_DAYS = 60;

/** Daily totals per channel for the last 60 days, with outcomes per the attribution source. */
export function mockAlertSeries(connections: Connection[], crm: CrmConnection, workspace: Workspace, now: number): AlertSeries {
  const today = todayIn(workspace.timeZone, now);
  const source = attributionContext(crm).source;
  const earliest = addDays(today, -(ALERT_SERIES_DAYS - 1));
  const { rows } = generateMockHistory(today, analyticsChannels(connections, workspace.timeZone, now), crm.leadStage);
  const byKey = new Map<string, AlertDay>();
  for (const row of resolveRows(rows.filter((entry) => entry.date >= earliest), source)) {
    const key = `${row.date}|${row.platform}`;
    const day = byKey.get(key) ?? { date: row.date, platform: row.platform, totals: EMPTY_TOTALS };
    byKey.set(key, { ...day, totals: addTotals(day.totals, row) });
  }
  return { source, currency: workspace.currency, today, days: [...byKey.values()] };
}
