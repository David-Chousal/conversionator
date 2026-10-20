import { describe, expect, test } from "vitest";
import { fixtureReport } from "@/lib/analytics/fixtures";
import { buildReportContent } from "./content";
import { reportCsv, reportFilename, reportPdf } from "./export";
import type { ReportInput } from "./types";

const input: ReportInput = { name: "March review", metrics: ["spend", "roas"], platforms: ["google-ads", "meta-ads"], window: { kind: "rolling", days: 30 }, compare: true, format: "csv", schedule: "none", recipients: [] };
const content = buildReportContent(input, fixtureReport({ excluded: ["linkedin-ads"] }), "2026-03-30");

describe("report export", () => {
  test("CSV has one row per campaign with raw numbers and a total", () => {
    const lines = reportCsv(content).trim().split("\r\n");
    expect(lines[0]).toBe("Channel,Campaign,Ad spend (USD),ROAS");
    expect(lines.at(-1)).toMatch(/^Total,All campaigns,\d+\.\d{2},\d+\.\d{2}$/);
    expect(lines).toHaveLength(content.campaigns.length + 2);
  });

  test("names the file after the report and its dates", () => {
    expect(reportFilename(content, "csv")).toBe("march-review-2026-03-01-to-2026-03-30.csv");
  });

  test("PDF is a real PDF", async () => {
    const bytes = await reportPdf(content);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });
});
