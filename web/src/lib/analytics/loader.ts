import { connection } from "next/server";
import { dataSource } from "@/lib/data";
import { analyticsChannels } from "@/lib/data/mock-analytics";
import { todayIn } from "./dates";
import { parseFilter, type Query } from "./filter";
import { DEFAULT_VIEW_ID, type SavedView } from "./layout";
import type { AnalyticsReport } from "./types";

export type AnalyticsPageData = { state: "no-channels" } | { state: "ready"; report: AnalyticsReport; views: SavedView[]; activeViewId: string };

/** Reads the filter from the URL and loads the report. Request time only: it depends on the clock. */
export async function loadAnalyticsPage(query: Query): Promise<AnalyticsPageData> {
  await connection();
  const [workspace, connections, campaigns, views, preferences] = await Promise.all([dataSource.getWorkspace(), dataSource.listConnections(), dataSource.listCampaigns(), dataSource.listViews(), dataSource.getPreferences()]);
  const now = Date.now();
  const channels = analyticsChannels(connections, workspace.timeZone, now);
  if (channels.length === 0) return { state: "no-channels" };
  const today = todayIn(workspace.timeZone, now);
  const filter = parseFilter(query, today, channels.map((channel) => channel.platform), campaigns.map((campaign) => campaign.id), preferences.defaultRangeDays);
  const requested = typeof query.view === "string" ? query.view : DEFAULT_VIEW_ID;
  const activeViewId = views.some((view) => view.id === requested) ? requested : DEFAULT_VIEW_ID;
  return { state: "ready", report: await dataSource.getAnalytics(filter), views, activeViewId };
}
