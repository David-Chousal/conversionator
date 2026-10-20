import { describe, expect, test } from "vitest";
import { buildDrill, drillCell, drillExport } from "./drilldown";
import { PLATFORM_ATTRIBUTION, fixtureReport } from "./fixtures";

const report = fixtureReport();
const readoutValue = (key: string) => report.readouts.find((r) => r.key === key)?.value;
const ALL = { platform: null, campaignId: null };

describe("buildDrill from a readout", () => {
  const view = buildDrill(report, { metric: "roas", ...ALL, bucket: null });

  test("breaks the metric down by channel", () => {
    expect(view.level).toBe("channels");
    expect(view.rows.map((row) => row.name).sort()).toEqual(["Google Ads", "LinkedIn Ads", "Meta Ads"]);
    expect(view.rows.every((row) => row.drillable)).toBe(true);
  });

  test("has totals and a readout that match the board exactly", () => {
    expect(view.readout.value).toBeCloseTo(readoutValue("roas") as number, 10);
    expect(view.totals.spend).toBeCloseTo(readoutValue("spend") as number, 6);
  });

  test("keeps the readout's attribution source", () => {
    expect(view.readout.sourceLabel).toBe("HubSpot");
  });

  test("sorts by the metric, best first", () => {
    const roas = view.rows.map((row) => row.totals.revenue / row.totals.spend);
    expect([...roas].sort((a, b) => b - a)).toEqual(roas);
  });

  test("shows the columns that explain the metric", () => {
    expect(view.columns.map((column) => column.label)).toEqual(["Spend", "Revenue", "ROAS"]);
  });

  test("starts the breadcrumbs at the metric", () => {
    expect(view.crumbs.map((crumb) => crumb.label)).toEqual(["ROAS", "All channels"]);
  });
});

describe("buildDrill into a channel", () => {
  const view = buildDrill(report, { metric: "cpl", platform: "google-ads", campaignId: null, bucket: null });

  test("lists that channel's campaigns, each opening its ads", () => {
    expect(view.level).toBe("campaigns");
    expect(view.rows.every((row) => row.platform === "google-ads" && row.drillable)).toBe(true);
  });

  test("sorts cost per lead cheapest first", () => {
    const cpl = view.rows.map((row) => row.totals.spend / row.totals.leads);
    expect([...cpl].sort((a, b) => a - b)).toEqual(cpl);
  });

  test("adds the channel to the breadcrumbs, with All channels as a way back", () => {
    expect(view.crumbs).toEqual([
      { label: "Cost per lead", target: ALL },
      { label: "All channels", target: ALL },
      { label: "Google Ads", target: "current" },
    ]);
  });

  test("compares with the same channel in the previous window", () => {
    expect(view.readout.previous).not.toBeNull();
  });
});

describe("buildDrill into a campaign", () => {
  const view = buildDrill(report, { metric: "roas", platform: "google-ads", campaignId: "google-generic", bucket: null });

  test("lists the campaign's ads", () => {
    expect(view.level).toBe("ads");
    expect(view.rows.map((row) => row.name).sort()).toEqual(["RSA · Best running shoes", "RSA · Under $100", "RSA · Wide fit"]);
    expect(view.rows.some((row) => row.drillable)).toBe(false);
  });

  test("ends the breadcrumbs at the campaign, with the channel as a way back", () => {
    expect(view.crumbs.map((crumb) => crumb.label)).toEqual(["ROAS", "All channels", "Google Ads", "Generic · running shoes"]);
    expect(view.crumbs[2].target).toEqual({ platform: "google-ads", campaignId: null });
  });

  test("totals match the campaign's row on the board", () => {
    const campaign = report.campaigns.find((row) => row.id === "google-generic")!;
    expect(view.totals.spend).toBeCloseTo(campaign.spend, 6);
  });
});

describe("buildDrill from a chart point", () => {
  const last = report.trace.bucketStarts.length - 1;
  const view = buildDrill(report, { metric: "spend", ...ALL, bucket: last });

  test("scopes to that bucket's dates", () => {
    expect(view.scopeLabel).toContain("Mar 24 → Mar 30");
    expect(view.windowDays).toBe(7);
  });

  test("totals the bucket's spend, matching the chart", () => {
    const chartTotal = report.trace.series.reduce((sum, series) => sum + (series.values[last] ?? 0), 0);
    expect(view.totals.spend).toBeCloseTo(chartTotal, 6);
  });

  test("compares with the previous bucket", () => {
    expect(view.readout.previous).toBeGreaterThan(0);
  });
});

describe("buildDrill without a CRM", () => {
  test("names conversions and CPA plainly and labels them platform-reported", () => {
    const view = buildDrill(fixtureReport({}, PLATFORM_ATTRIBUTION), { metric: "cpa", ...ALL, bucket: null });
    expect(view.crumbs[0].label).toBe("CPA");
    expect(view.columns.map((column) => column.label)).toEqual(["Spend", "Conv.", "CPA"]);
    expect(view.readout.sourceLabel).toBe("Platform-reported");
  });
});

describe("drillCell", () => {
  const totals = { spend: 2000, revenue: 9000, conversions: 50, clicks: 0, impressions: 0, leads: 200 };

  test("formats each column for a row", () => {
    const grand = { ...totals, spend: 8000 };
    expect(drillCell("spend", totals, grand, "USD")).toBe("$2,000");
    expect(drillCell("share", totals, grand, "USD")).toBe("25.0%");
    expect(drillCell("roas", totals, grand, "USD")).toBe("4.5×");
    expect(drillCell("cpa", totals, grand, "USD")).toBe("$40.00");
    expect(drillCell("cpl", totals, grand, "USD")).toBe("$10.00");
    expect(drillCell("leads", totals, grand, "USD")).toBe("200");
  });

  test("uses the share of the metric itself for counts", () => {
    const grand = { ...totals, spend: 8000, conversions: 100, leads: 800 };
    expect(drillCell("share", totals, grand, "USD", "conversions")).toBe("50.0%");
    expect(drillCell("share", totals, grand, "USD", "leads")).toBe("25.0%");
  });
});

describe("drillExport", () => {
  test("exports raw numbers for the rows shown", () => {
    const view = buildDrill(report, { metric: "roas", ...ALL, bucket: null });
    const { headers, rows } = drillExport(view);
    expect(headers).toEqual(["Channel", "Channel code", "Spend", "Revenue", "ROAS"]);
    expect(rows).toHaveLength(view.rows.length);
    expect(rows[0][2]).toMatch(/^\d+\.\d{2}$/);
  });

  test("names the first column after the level", () => {
    const view = buildDrill(report, { metric: "roas", platform: "google-ads", campaignId: "google-brand", bucket: null });
    expect(drillExport(view).headers[0]).toBe("Ad");
  });
});
