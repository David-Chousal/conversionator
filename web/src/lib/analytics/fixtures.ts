import { generateMockHistory } from "./mock-history";
import { buildReport } from "./report";
import type { AnalyticsFilter, AnalyticsReport, AttributionContext, ChannelInput } from "./types";

export const FIXTURE_TODAY = "2026-03-30";

const ok = { state: "ok" as const, lit: 4, word: "Synced", age: "4m" };
export const FIXTURE_CHANNELS: ChannelInput[] = [
  { platform: "google-ads", name: "Google Ads", channelCode: "CH·01", signal: ok, dataThrough: FIXTURE_TODAY },
  { platform: "meta-ads", name: "Meta Ads", channelCode: "CH·02", signal: ok, dataThrough: FIXTURE_TODAY },
  { platform: "linkedin-ads", name: "LinkedIn Ads", channelCode: "CH·03", signal: ok, dataThrough: FIXTURE_TODAY },
];

/** A realistic report built from the mock generator, for tests. */
export const CRM_ATTRIBUTION: AttributionContext = { source: "crm", crmName: "HubSpot", leadStage: "mql", crmStatus: "connected" };
export const PLATFORM_ATTRIBUTION: AttributionContext = { source: "platform", crmName: null, leadStage: null, crmStatus: "available" };

export function fixtureReport(filter: Partial<AnalyticsFilter> = {}, attribution: AttributionContext = CRM_ATTRIBUTION): AnalyticsReport {
  const { rows, campaigns, ads, unattributed } = generateMockHistory(FIXTURE_TODAY, FIXTURE_CHANNELS, "mql");
  return buildReport({
    rows, campaigns, ads, unattributed, attribution, channels: FIXTURE_CHANNELS, today: FIXTURE_TODAY, currency: "USD",
    filter: { from: "2026-03-01", to: FIXTURE_TODAY, excluded: [], campaignId: null, ...filter },
  });
}
