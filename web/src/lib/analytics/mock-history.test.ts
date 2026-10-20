import { describe, expect, test } from "vitest";
import { generateMockHistory } from "./mock-history";

const TODAY = "2026-03-30";
const CHANNELS = [{ platform: "google-ads" as const, dataThrough: TODAY }, { platform: "meta-ads" as const, dataThrough: "2026-03-28" }];

describe("generateMockHistory", () => {
  const history = generateMockHistory(TODAY, CHANNELS, "mql");

  test("is deterministic for the same day", () => {
    const again = generateMockHistory(TODAY, CHANNELS, "mql");
    expect(again.rows.slice(0, 5)).toEqual(history.rows.slice(0, 5));
  });

  test("covers 180 days for each ad and never goes negative", () => {
    const ad = history.ads.find((entry) => entry.campaignId === "google-brand")!;
    expect(history.rows.filter((r) => r.adId === ad.id)).toHaveLength(180);
    expect(history.rows.every((r) => r.spend >= 0 && r.platformRevenue >= 0 && r.crmRevenue >= 0)).toBe(true);
  });

  test("gives every campaign at least two ads", () => {
    for (const campaign of history.campaigns) expect(history.ads.filter((ad) => ad.campaignId === campaign.id).length).toBeGreaterThanOrEqual(2);
  });

  test("has platforms claim more conversions than HubSpot attributes", () => {
    const sum = (key: "platformConversions" | "crmDeals") => history.rows.reduce((total, r) => total + r[key], 0);
    expect(sum("platformConversions")).toBeGreaterThan(sum("crmDeals"));
  });

  test("counts fewer leads at a stricter lifecycle stage", () => {
    const leads = (stage: "lead" | "sql") => generateMockHistory(TODAY, CHANNELS, stage).rows.reduce((total, r) => total + r.crmLeads, 0);
    expect(leads("sql")).toBeLessThan(leads("lead"));
  });

  test("includes CRM leads that came from no ad", () => {
    expect(history.unattributed.length).toBe(180);
    expect(history.unattributed.some((day) => day.leads > 0)).toBe(true);
  });

  test("stops a channel's data at its last sync", () => {
    const latestMeta = history.rows.filter((r) => r.platform === "meta-ads").map((r) => r.date).sort().at(-1);
    expect(latestMeta).toBe("2026-03-28");
  });

  test("has no spend before a campaign launches", () => {
    const sale = history.campaigns.find((c) => c.id === "google-spring-sale")!;
    const early = history.rows.filter((r) => r.campaignId === sale.id && r.date < sale.startDate!);
    expect(early).toHaveLength(0);
  });

  test("lands near the design system's example spend for Google Ads over 30 days", () => {
    const spend = history.rows.filter((r) => r.platform === "google-ads" && r.date > "2026-02-28").reduce((sum, r) => sum + r.spend, 0);
    expect(spend).toBeGreaterThan(17_000);
    expect(spend).toBeLessThan(26_000);
  });
});
