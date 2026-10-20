import { describe, expect, test } from "vitest";
import { addDays, type IsoDate } from "@/lib/analytics/dates";
import { EMPTY_TOTALS } from "@/lib/analytics/metrics";
import { evaluateAlert } from "./alert-evaluate";
import type { AlertDay, AlertRule } from "./settings-types";

const TODAY = "2026-10-18" as IsoDate;
const spendDays = (values: number[], platform: AlertDay["platform"] = "meta-ads"): AlertDay[] =>
  values.map((spend, i) => ({ date: addDays(TODAY, i - (values.length - 1)), platform, totals: { ...EMPTY_TOTALS, spend, revenue: spend * 3, impressions: 100 } }));
const rule: AlertRule = { id: "a", metric: "spend", platform: "meta-ads", condition: "above", threshold: 100, period: "day", delivery: "email", slackChannel: null, scope: "personal", ownerId: "u", ownerName: "U", paused: false, createdAt: "2026-01-01T00:00:00Z" };

describe("evaluateAlert", () => {
  test("fires when the condition starts being true, not every day it stays true", () => {
    const firings = evaluateAlert(rule, spendDays([50, 120, 130, 60, 150]), TODAY, 30);
    expect(firings.map((firing) => firing.value)).toEqual([150, 120]);
  });

  test("only looks inside the window", () => {
    expect(evaluateAlert(rule, spendDays([150, 50, 50]), TODAY, 2)).toEqual([]);
  });

  test("sums all channels when the rule covers all of them", () => {
    const days = [...spendDays([60]), ...spendDays([60], "google-ads")];
    expect(evaluateAlert({ ...rule, platform: "all" }, days, TODAY, 30)).toHaveLength(1);
  });

  test("weekly rules use the trailing seven days", () => {
    const firings = evaluateAlert({ ...rule, period: "week", threshold: 600 }, spendDays([100, 100, 100, 100, 100, 100, 100, 100]), TODAY, 30);
    expect(firings).toHaveLength(1);
    expect(firings[0].value).toBe(700);
  });

  test("change rules compare against the period before", () => {
    const firings = evaluateAlert({ ...rule, condition: "change", threshold: 25 }, spendDays([100, 100, 140]), TODAY, 30);
    expect(firings).toEqual([expect.objectContaining({ date: TODAY, value: 140, previous: 100 })]);
  });

  test("skips days with no data instead of reading them as zero", () => {
    const days = spendDays([200, 200]).map((day, i) => (i === 0 ? { ...day, totals: EMPTY_TOTALS } : day));
    expect(evaluateAlert({ ...rule, condition: "below", threshold: 100 }, days, TODAY, 30)).toEqual([]);
  });
});
