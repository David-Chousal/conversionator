import { describe, expect, test } from "vitest";
import { emptyReport, validateReport } from "./rules";
import type { ReportInput } from "./types";

const ctx = { available: ["google-ads", "meta-ads"] as const, today: "2026-10-18" };
const good: ReportInput = { name: "Monthly performance", metrics: ["spend", "roas"], platforms: ["google-ads"], window: { kind: "rolling", days: 30 }, compare: true, format: "pdf", schedule: "none", recipients: [] };
const check = (patch: Partial<ReportInput>) => validateReport({ ...good, ...patch }, { ...ctx, available: [...ctx.available] });

describe("validateReport", () => {
  test("a complete report has no errors", () => {
    expect(check({})).toEqual({});
  });

  test("needs a name, a metric and a channel", () => {
    expect(check({ name: " ", metrics: [], platforms: [] })).toEqual({ name: "Name the report.", metrics: "Pick at least one metric.", platforms: "Pick at least one channel." });
  });

  test("names channels that are no longer connected", () => {
    expect(check({ platforms: ["google-ads", "linkedin-ads"] }).platforms).toBe("LinkedIn Ads isn't connected anymore. Remove it or reconnect it.");
  });

  test("checks custom windows against history and today", () => {
    expect(check({ window: { kind: "custom", from: "2026-10-10", to: "2026-10-01" } }).window).toBe("The start date is after the end date.");
    expect(check({ window: { kind: "custom", from: "2026-01-01", to: "2026-02-01" } }).window).toBe("COR keeps 180 days of history. Start on or after Apr 22, 2026.");
    expect(check({ window: { kind: "custom", from: "2026-10-01", to: "2026-10-20" } }).window).toBe("End on or before today.");
  });

  test("scheduled reports need a rolling window and real recipients", () => {
    expect(check({ schedule: "weekly", window: { kind: "custom", from: "2026-10-01", to: "2026-10-07" }, recipients: ["a@x.co"] }).window).toBe("Scheduled reports use a rolling window, like Last 30 days.");
    expect(check({ schedule: "monthly" }).recipients).toBe("Add at least one recipient.");
    expect(check({ schedule: "monthly", recipients: ["ok@x.co", "nope"] }).recipients).toBe("nope isn't a full email address.");
  });

  test("ignores recipients when nothing is scheduled", () => {
    expect(check({ recipients: ["nope"] }).recipients).toBeUndefined();
  });
});

describe("emptyReport", () => {
  test("starts with the board's metrics, every channel and the last 30 days", () => {
    expect(emptyReport("crm", ["google-ads", "meta-ads"])).toMatchObject({ name: "", metrics: ["spend", "leads", "cpl", "roas"], platforms: ["google-ads", "meta-ads"], window: { kind: "rolling", days: 30 }, format: "pdf", schedule: "none" });
  });
});
