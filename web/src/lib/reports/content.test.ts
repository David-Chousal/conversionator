import { describe, expect, test } from "vitest";
import { PLATFORM_ATTRIBUTION, fixtureReport } from "@/lib/analytics/fixtures";
import { buildReportContent } from "./content";
import type { ReportInput } from "./types";

const input: ReportInput = { name: "March review", metrics: ["spend", "roas", "leads"], platforms: ["google-ads", "meta-ads", "linkedin-ads"], window: { kind: "rolling", days: 30 }, compare: true, format: "pdf", schedule: "none", recipients: [] };

describe("buildReportContent", () => {
  const content = buildReportContent(input, fixtureReport(), "2026-03-30");

  test("titles the report with its window and attribution", () => {
    expect(content).toMatchObject({ title: "March review", windowLabel: "Mar 1 → Mar 30", sourceLabel: "Leads and revenue attributed by HubSpot · last ad interaction", empty: false });
    expect(content.previousLabel).toMatch(/^Compared with /);
    expect(content.metrics.map((metric) => metric.label)).toEqual(["Ad spend", "ROAS", "Leads"]);
  });

  test("summarises each metric with its change", () => {
    expect(content.summary).toHaveLength(3);
    expect(content.summary[0]).toMatchObject({ key: "spend" });
    expect(content.summary[0].value).toMatch(/^\$/);
    expect(content.summary[0].change).toMatch(/^[+−]/);
  });

  test("breaks totals down by channel, adding up to the total", () => {
    expect(content.byChannel.map((row) => row.name)).toEqual(["Google Ads", "Meta Ads", "LinkedIn Ads"]);
    const spend = content.byChannel.reduce((sum, row) => sum + (row.values[0] ?? 0), 0);
    expect(spend).toBeCloseTo(content.total[0] ?? 0, 2);
  });

  test("lists campaigns by spend", () => {
    const spends = content.campaigns.map((row) => row.values[0] ?? 0);
    expect(spends).toEqual([...spends].sort((a, b) => b - a));
    expect(content.campaigns[0].channel).toMatch(/Ads$/);
  });

  test("leaves the comparison out when asked", () => {
    const plain = buildReportContent({ ...input, compare: false }, fixtureReport(), "2026-03-30");
    expect(plain.previousLabel).toBeNull();
    expect(plain.summary[0].change).toBeNull();
  });

  test("labels platform-reported numbers and drops CRM-only metrics without a CRM", () => {
    const platform = buildReportContent(input, fixtureReport({}, PLATFORM_ATTRIBUTION), "2026-03-30");
    expect(platform.sourceLabel).toBe("Platform-reported conversions and revenue");
    expect(platform.metrics.map((metric) => metric.key)).toEqual(["spend", "roas"]);
  });

  test("says when the window has no data", () => {
    const empty = buildReportContent(input, fixtureReport({ from: "2026-03-30", to: "2026-03-30", excluded: ["google-ads", "meta-ads", "linkedin-ads"] }), "2026-03-30");
    expect(empty.empty).toBe(true);
  });
});
