import { todayIn } from "@/lib/analytics/dates";
import { buildReport } from "@/lib/analytics/report";
import type { AdInfo, AnalyticsFilter, AnalyticsReport, AttributionContext, CampaignInfo, RawDailyRow } from "@/lib/analytics/types";
import { analyticsChannels } from "./mock-analytics";
import type { Connection, Platform, Workspace } from "./types";

/** One day of one campaign, as the external ads API (and the backend's GET /metrics) reports it. */
export interface BackendMetricRow {
  date: string;
  campaignId: string;
  campaign: string;
  spendCents: number;
  clicks: number;
  engagements: number;
  impressions: number;
  conversions: number;
}

/** The cached rows of one external source. */
export interface BackendMetricsSource {
  id: string;
  platform: Platform;
  name: string;
  data: BackendMetricRow[];
}

/** The cached payload has no revenue field; demo conversions are valued at this order value. */
const DEMO_ORDER_VALUE = 150;

/** Maps the backend's cached rows onto the report pipeline's RawDailyRow. */
export function rowsFromSources(sources: BackendMetricsSource[]): RawDailyRow[] {
  return sources.flatMap((source) =>
    source.data.map((row) => ({
      date: row.date,
      platform: source.platform,
      campaignId: row.campaignId,
      adId: `${row.campaignId}-all`, // one ad per campaign in the demo source
      spend: row.spendCents / 100,
      impressions: row.impressions,
      clicks: row.clicks,
      platformConversions: row.conversions,
      platformRevenue: row.conversions * DEMO_ORDER_VALUE,
      crmLeads: 0, // no CRM connected; outcomes are platform-reported
      crmDeals: 0,
      crmRevenue: 0,
    })),
  );
}

/** Distinct campaigns with the first day their data covers. */
export function campaignsFromSources(sources: BackendMetricsSource[]): CampaignInfo[] {
  return sources.flatMap((source) => {
    const firstDate = new Map<string, string>();
    for (const row of source.data) {
      const seen = firstDate.get(row.campaignId);
      if (!seen || row.date < seen) firstDate.set(row.campaignId, row.date);
    }
    return [...firstDate].map(([id, startDate]) => ({
      id,
      name: source.data.find((row) => row.campaignId === id)?.campaign ?? id,
      platform: source.platform,
      startDate,
    }));
  });
}

function adsFromSources(sources: BackendMetricsSource[]): AdInfo[] {
  return sources.flatMap((source) => {
    const seen = new Set<string>();
    return source.data
      .filter((row) => (seen.has(row.campaignId) ? false : seen.add(row.campaignId)))
      .map((row) => ({ id: `${row.campaignId}-all`, name: row.campaign, campaignId: row.campaignId, platform: source.platform }));
  });
}

const PLATFORM_ATTRIBUTION: AttributionContext = {
  source: "platform",
  crmName: null,
  leadStage: null,
  crmStatus: "available",
};

/** buildReport over the backend's cached ad data — the same pipeline the mock feeds. */
export function reportFromSources(
  sources: BackendMetricsSource[],
  connections: Connection[],
  workspace: Workspace,
  filter: AnalyticsFilter,
  now: number,
): AnalyticsReport {
  return buildReport({
    rows: rowsFromSources(sources),
    campaigns: campaignsFromSources(sources),
    ads: adsFromSources(sources),
    unattributed: [],
    attribution: PLATFORM_ATTRIBUTION,
    channels: analyticsChannels(connections, workspace.timeZone, now),
    filter,
    today: todayIn(workspace.timeZone, now),
    currency: workspace.currency,
  });
}
