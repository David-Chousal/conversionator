import { describe, expect, it } from "vitest";
import { campaignsFromSources, reportFromSources, rowsFromSources, type BackendMetricsSource } from "./backend-analytics";
import type { Connection, Workspace } from "./types";

const ROWS = [
  { date: "2026-09-01", campaignId: "spring-launch", campaign: "Spring Launch", spendCents: 4500, clicks: 42, engagements: 10, impressions: 900, conversions: 3 },
  { date: "2026-09-02", campaignId: "spring-launch", campaign: "Spring Launch", spendCents: 5000, clicks: 51, engagements: 12, impressions: 1100, conversions: 4 },
  { date: "2026-08-30", campaignId: "always-on", campaign: "Always On", spendCents: 2000, clicks: 20, engagements: 5, impressions: 500, conversions: 1 },
];

const SOURCE: BackendMetricsSource = {
  id: "7",
  platform: "google-ads",
  name: "google-ads (demo)",
  data: ROWS,
};

const WORKSPACE: Workspace = { id: "w1", name: "COR Demo Workspace", currency: "USD", timeZone: "America/Los_Angeles", weekStart: "monday" };

const CONNECTED: Connection = {
  id: "7",
  channelCode: "CH·01",
  platform: "google-ads",
  name: "google-ads (demo)",
  account: "google-ads (demo)",
  status: "connected",
  lastSyncedAt: new Date().toISOString(),
  datasets: { enabled: 1, total: 1 },
  nextSyncAt: null,
};

const FILTER = { from: "2026-08-01", to: "2026-09-30", excluded: [], campaignId: null };

describe("rowsFromSources", () => {
  it("maps the backend rows onto the report pipeline's raw rows", () => {
    const rows = rowsFromSources([SOURCE]);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      date: "2026-09-01",
      platform: "google-ads",
      campaignId: "spring-launch",
      adId: "spring-launch-all",
      spend: 45, // cents -> dollars
      clicks: 42,
      impressions: 900,
      platformConversions: 3,
    });
  });

  it("values platform revenue from conversions and keeps CRM outcomes at zero", () => {
    const rows = rowsFromSources([SOURCE]);
    expect(rows[0].platformRevenue).toBe(3 * 150);
    expect(rows[0].crmLeads).toBe(0);
    expect(rows[0].crmDeals).toBe(0);
    expect(rows[0].crmRevenue).toBe(0);
  });
});

describe("campaignsFromSources", () => {
  it("derives distinct campaigns with the first day their data covers", () => {
    const campaigns = campaignsFromSources([SOURCE]);
    expect(campaigns).toEqual([
      { id: "spring-launch", name: "Spring Launch", platform: "google-ads", startDate: "2026-09-01" },
      { id: "always-on", name: "Always On", platform: "google-ads", startDate: "2026-08-30" },
    ]);
  });
});

describe("reportFromSources", () => {
  it("builds a full report from the cached ad data", () => {
    const report = reportFromSources([SOURCE], [CONNECTED], WORKSPACE, FILTER, Date.parse("2026-09-03T12:00:00Z"));
    expect(report.hasData).toBe(true);
    expect(report.attribution.source).toBe("platform");
    expect(report.campaignOptions).toHaveLength(2);
    // 4500 + 5000 + 2000 cents within the window
    expect(report.campaignTotals.spend).toBe(115);
    expect(report.campaignTotals.conversions).toBe(8);
  });

  it("produces an empty report before any source has synced", () => {
    const report = reportFromSources([{ ...SOURCE, data: [] }], [CONNECTED], WORKSPACE, FILTER, Date.now());
    expect(report.hasData).toBe(false);
  });
});
