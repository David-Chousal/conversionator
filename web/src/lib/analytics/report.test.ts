import { describe, expect, test } from "vitest";
import { buildReport, type ReportInput } from "./report";
import type { RawDailyRow } from "./types";

const TODAY = "2026-03-30";
const ok = { state: "ok" as const, lit: 4, word: "Synced", age: "4m" };

// Platform-reported numbers are deliberately larger than HubSpot's, as pixels over-claim.
function row(date: string, platform: RawDailyRow["platform"], campaignId: string, spend: number, revenue: number, conversions: number): RawDailyRow {
  return {
    date, platform, campaignId, adId: `${campaignId}-ad`, spend, clicks: spend, impressions: spend * 50,
    platformConversions: conversions * 2, platformRevenue: revenue * 2,
    crmLeads: conversions * 3, crmDeals: conversions, crmRevenue: revenue,
  };
}

// Google spends 100/day with 400 revenue; Meta spends 50/day with 100 revenue, every day for 120 days.
function input(overrides: Partial<ReportInput["filter"]> = {}): ReportInput {
  const rows: RawDailyRow[] = [];
  for (let i = 0; i < 120; i += 1) {
    const date = new Date(Date.parse(`${TODAY}T00:00:00Z`) - i * 86_400_000).toISOString().slice(0, 10);
    rows.push(row(date, "google-ads", "g1", 100, 400, 4), row(date, "meta-ads", "m1", 50, 100, 2));
  }
  return {
    rows,
    campaigns: [
      { id: "g1", name: "Brand search", platform: "google-ads", startDate: null },
      { id: "m1", name: "Lookalike", platform: "meta-ads", startDate: "2026-03-20" },
    ],
    channels: [
      { platform: "google-ads", name: "Google Ads", channelCode: "CH·01", signal: ok, dataThrough: TODAY },
      { platform: "meta-ads", name: "Meta Ads", channelCode: "CH·02", signal: { state: "stale", lit: 2, word: "Stale", age: "6h" }, dataThrough: "2026-03-28" },
    ],
    ads: [
      { id: "g1-ad", name: "RSA · Free returns", campaignId: "g1", platform: "google-ads" },
      { id: "m1-ad", name: "Carousel · new arrivals", campaignId: "m1", platform: "meta-ads" },
    ],
    unattributed: Array.from({ length: 120 }, (_, i) => ({ date: new Date(Date.parse(`${TODAY}T00:00:00Z`) - i * 86_400_000).toISOString().slice(0, 10), leads: 9, deals: 1, revenue: 100 })),
    filter: { from: "2026-03-01", to: TODAY, excluded: [], campaignId: null, ...overrides },
    today: TODAY,
    currency: "USD",
    attribution: { source: "crm", crmName: "HubSpot", leadStage: "mql", crmStatus: "connected" },
  };
}

describe("buildReport", () => {
  test("uses HubSpot's leads and closed-won deals when the CRM is connected", () => {
    const keys = buildReport(input()).readouts.map((r) => r.key);
    expect(keys).toEqual(["spend", "leads", "cpl", "roas"]);
    expect(buildReport(input()).readouts.find((r) => r.key === "leads")?.value).toBe(30 * 18);
  });

  test("computes a readout for every metric so any tile can show any of them", () => {
    const byKey = buildReport(input()).readoutsByKey;
    expect(Object.keys(byKey).sort()).toEqual(["conversions", "cpa", "cpl", "leads", "roas", "spend"]);
    expect(byKey.conversions.value).toBe(30 * 6);
  });

  test("labels conversion-based readouts with their source", () => {
    const readouts = buildReport(input()).readouts;
    expect(readouts.find((r) => r.key === "spend")?.sourceLabel).toBeNull();
    expect(readouts.find((r) => r.key === "roas")?.sourceLabel).toBe("HubSpot");
  });

  test("falls back to platform-reported conversions, labelled as such, without a CRM", () => {
    const report = buildReport({ ...input(), attribution: { source: "platform", crmName: null, leadStage: null, crmStatus: "available" } });
    expect(report.readouts.map((r) => r.key)).toEqual(["spend", "conversions", "cpa", "roas"]);
    expect(report.readouts.find((r) => r.key === "roas")).toMatchObject({ value: 1000 / 150, sourceLabel: "Platform-reported" });
  });

  test("reports how many CRM leads were attributed to ads and how many weren't", () => {
    const { attribution } = buildReport(input());
    expect(attribution.attributed.leads).toBe(30 * 18);
    expect(attribution.unattributed.leads).toBe(30 * 9);
  });

  test("keeps per-ad totals so the drill-down can reach individual ads", () => {
    const report = buildReport(input());
    expect(report.adTotals["g1-ad"]).toMatchObject({ platform: "google-ads", campaignId: "g1", spend: 3000 });
    expect(report.ads.map((ad) => ad.id)).toEqual(["g1-ad", "m1-ad"]);
  });

  test("totals the window across included channels", () => {
    const spend = buildReport(input()).readouts.find((r) => r.key === "spend");
    expect(spend?.value).toBe(30 * 150);
  });

  test("compares with the previous window of equal length", () => {
    const report = buildReport(input());
    expect(report.previous).toEqual({ from: "2026-01-30", to: "2026-02-28" });
    expect(report.readouts.find((r) => r.key === "spend")?.previous).toBe(30 * 150);
  });

  test("derives ROAS and CPA from totals", () => {
    const readouts = buildReport(input()).readouts;
    expect(readouts.find((r) => r.key === "roas")?.value).toBeCloseTo(500 / 150);
    expect(readouts.find((r) => r.key === "cpl")?.value).toBeCloseTo(150 / 18);
  });

  test("leaves excluded channels out of every number", () => {
    const report = buildReport(input({ excluded: ["meta-ads"] }));
    expect(report.readouts.find((r) => r.key === "spend")?.value).toBe(3000);
    expect(report.ledger.map((l) => l.platform)).toEqual(["google-ads"]);
  });

  test("keeps share of spend across all channels so muted ones still show", () => {
    const shares = buildReport(input({ excluded: ["meta-ads"] })).channels.map((c) => [c.platform, Math.round(c.share * 100), c.included]);
    expect(shares).toEqual([["google-ads", 67, true], ["meta-ads", 33, false]]);
  });

  test("narrows to one campaign", () => {
    const report = buildReport(input({ campaignId: "m1" }));
    expect(report.readouts.find((r) => r.key === "spend")?.value).toBe(1500);
    expect(report.campaigns.map((c) => c.id)).toEqual(["m1"]);
  });

  test("buckets windows over two weeks by week, ending on the last day", () => {
    const trace = buildReport(input()).trace;
    expect(trace.granularity).toBe("week");
    expect(trace.bucketEnds.at(-1)).toBe(TODAY);
    expect(trace.series[0].values.at(-1)).toBe(700);
  });

  test("uses days for short windows", () => {
    expect(buildReport(input({ from: "2026-03-24" })).trace.granularity).toBe("day");
  });

  test("marks stale channels and blanks buckets after their data stops", () => {
    const meta = buildReport(input({ from: "2026-03-24" })).trace.series.find((s) => s.platform === "meta-ads");
    expect(meta?.stale).toBe(true);
    expect(meta?.values.slice(-2)).toEqual([null, null]);
  });

  test("flags campaign launches inside the window", () => {
    expect(buildReport(input()).trace.annotations).toEqual([{ date: "2026-03-20", label: "Lookalike" }]);
  });

  test("gives each readout a 90-day range that contains its value", () => {
    const spend = buildReport(input()).readouts.find((r) => r.key === "spend")!;
    expect(spend.range).toEqual({ min: 4500, max: 4500 });
  });

  test("maps channel codes to series colors", () => {
    expect(buildReport(input()).channels.map((c) => c.colorIndex)).toEqual([1, 2]);
  });

  test("keeps per-ad totals for the previous window", () => {
    expect(buildReport(input()).previousAdTotals["g1-ad"]).toMatchObject({ platform: "google-ads", spend: 3000 });
  });

  test("keeps per-ad totals for each chart bucket", () => {
    const trace = buildReport(input()).trace;
    expect(trace.adsByBucket).toHaveLength(trace.bucketStarts.length);
    expect(trace.adsByBucket.at(-1)?.["m1-ad"]).toMatchObject({ campaignId: "m1", spend: 350 });
  });

  test("reports no data for a window before history starts", () => {
    expect(buildReport(input({ from: "2025-01-01", to: "2025-01-30" })).hasData).toBe(false);
  });
});
