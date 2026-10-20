import { describe, expect, test } from "vitest";
import { alertSentence, firingHeadline, formatThreshold } from "./alert-text";
import type { AlertRule } from "./settings-types";

const rule: AlertRule = { id: "a", metric: "roas", platform: "meta-ads", condition: "below", threshold: 2.5, period: "day", delivery: "slack", slackChannel: "#marketing", scope: "workspace", ownerId: "u_dakota", ownerName: "Dakota Goldstein", paused: false, createdAt: "2026-10-01T00:00:00Z" };
const ctx = { source: "crm" as const, currency: "USD" };

describe("formatThreshold", () => {
  test("formats by metric and condition", () => {
    expect(formatThreshold("roas", 2.5, "below", "USD")).toBe("2.5×");
    expect(formatThreshold("spend", 1900, "above", "USD")).toBe("$1,900");
    expect(formatThreshold("leads", 25, "change", "USD")).toBe("25%");
    expect(formatThreshold("conversions", 40, "above", "USD")).toBe("40");
  });
});

describe("alertSentence", () => {
  test("reads the rule back in plain English", () => {
    expect(alertSentence(rule, ctx)).toBe("When ROAS on Meta Ads drops below 2.5× in a day, post in #marketing on Slack.");
    expect(alertSentence({ ...rule, metric: "spend", platform: "all", condition: "above", threshold: 1900, delivery: "email", scope: "personal" }, ctx))
      .toBe("When Ad spend on all channels rises above $1,900 in a day, email me.");
    expect(alertSentence({ ...rule, metric: "conversions", condition: "change", threshold: 25, period: "week", delivery: "inApp", scope: "workspace" }, ctx))
      .toBe("When Deals won on Meta Ads changes by more than 25% over a week, tell the workspace in-app.");
  });
});

describe("firingHeadline", () => {
  test("says what happened with the value and the threshold", () => {
    expect(firingHeadline(rule, { value: 2.14, previous: null }, ctx)).toBe("ROAS on Meta Ads dropped to 2.1× (below 2.5×)");
    expect(firingHeadline(rule, { value: 2.47, previous: null }, ctx)).toBe("ROAS on Meta Ads dropped to 2.47× (below 2.5×)");
    expect(firingHeadline({ ...rule, metric: "spend", condition: "above", threshold: 1900 }, { value: 1900.4, previous: null }, ctx)).toBe("Ad spend on Meta Ads rose to $1,900.40 (above $1,900)");
    expect(firingHeadline({ ...rule, condition: "change", threshold: 20, metric: "leads" }, { value: 130, previous: 100 }, ctx)).toBe("Leads on Meta Ads rose 30% (more than 20%)");
  });
});
