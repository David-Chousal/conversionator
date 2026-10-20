import { describe, expect, test } from "vitest";
import { addDays, type IsoDate } from "@/lib/analytics/dates";
import { EMPTY_TOTALS } from "@/lib/analytics/metrics";
import { alertFeed, alertRows, parseSettingsTab } from "./settings-view";
import type { AlertRule, AlertSeries } from "./settings-types";

const TODAY = "2026-10-18" as IsoDate;
const days = (values: number[]) => values.map((spend, i) => ({ date: addDays(TODAY, i - (values.length - 1)), platform: "meta-ads" as const, totals: { ...EMPTY_TOTALS, spend, impressions: 10 } }));
const series: AlertSeries = { source: "crm", currency: "USD", today: TODAY, days: days([50, 150, 50, 50, 150, 50]) };
const rule = (id: string, extra: Partial<AlertRule> = {}): AlertRule => ({ id, metric: "spend", platform: "meta-ads", condition: "above", threshold: 100, period: "day", delivery: "email", slackChannel: null, scope: "workspace", ownerId: "u_dakota", ownerName: "Dakota Goldstein", paused: false, createdAt: "2026-09-01T00:00:00Z", ...extra });
const admin = { id: "u_david", role: "admin" as const };

describe("parseSettingsTab", () => {
  test("reads a known tab and falls back to General", () => {
    expect(parseSettingsTab({ tab: "alerts" })).toBe("alerts");
    expect(parseSettingsTab({ tab: "nope" })).toBe("general");
  });

  test("opens CRM when HubSpot's sign-in sends someone back", () => {
    expect(parseSettingsTab({ connected: "hubspot" })).toBe("crm");
  });
});

describe("alertRows", () => {
  test("reads each rule back, with who owns it and how often it fired", () => {
    const [row] = alertRows([rule("a")], admin, series);
    expect(row).toMatchObject({ id: "a", canManage: true, owner: "Workspace · Dakota G.", fired: "Fired 2× · last Oct 17" });
    expect(row.sentence).toBe("When Ad spend on Meta Ads rises above $100 in a day, email the admins.");
  });

  test("says when a rule hasn't fired or is paused", () => {
    const [quiet, paused] = alertRows([rule("q", { threshold: 500 }), rule("p", { paused: true, scope: "personal", ownerId: "u_david" })], admin, series);
    expect(quiet.fired).toBe("Hasn't fired in 30 days");
    expect(paused).toMatchObject({ owner: "Personal", fired: "Paused" });
  });
});

describe("alertFeed", () => {
  test("lists recent firings from active rules, newest first", () => {
    const feed = alertFeed([rule("a"), rule("p", { paused: true })], series);
    expect(feed.map((entry) => [entry.ruleId, entry.when])).toEqual([["a", "Yesterday"], ["a", "Oct 14"]]);
    expect(feed[0].headline).toBe("Ad spend on Meta Ads rose to $150 (above $100)");
  });
});
