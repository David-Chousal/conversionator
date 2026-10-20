import { describe, expect, test } from "vitest";
import { canManageAlert, emptyDraft, validateAlertDraft, visibleAlerts } from "./alert-rules";
import type { AlertDraft, AlertRule } from "./settings-types";

const complete: AlertDraft = { metric: "roas", platform: "meta-ads", condition: "below", threshold: 2.5, period: "day", delivery: "slack", slackChannel: "#marketing", scope: "workspace" };
const crm = { hasCrm: true };

describe("validateAlertDraft", () => {
  test("a complete draft has no errors", () => {
    expect(validateAlertDraft(complete, crm)).toEqual({});
  });

  test("an empty draft asks for every slot", () => {
    expect(Object.keys(validateAlertDraft(emptyDraft("personal"), crm)).sort()).toEqual(["condition", "delivery", "metric", "platform", "threshold"]);
  });

  test("thresholds must be positive, whole for counts, and sane for changes", () => {
    expect(validateAlertDraft({ ...complete, threshold: 0 }, crm).threshold).toBe("Use a number above 0.");
    expect(validateAlertDraft({ ...complete, metric: "leads", condition: "above", threshold: 4.5 }, crm).threshold).toBe("Use a whole number.");
    expect(validateAlertDraft({ ...complete, condition: "change", threshold: 5000 }, crm).threshold).toBe("Use a change between 1% and 1,000%.");
  });

  test("Slack needs a channel name", () => {
    expect(validateAlertDraft({ ...complete, slackChannel: "marketing" }, crm).slackChannel).toBe("Use a Slack channel like #marketing.");
    expect(validateAlertDraft({ ...complete, delivery: "email", slackChannel: "" }, crm).slackChannel).toBeUndefined();
  });

  test("lead metrics need a CRM", () => {
    expect(validateAlertDraft({ ...complete, metric: "cpl" }, { hasCrm: false }).metric).toBe("Leads come from your CRM. Connect HubSpot to alert on them.");
  });
});

describe("who sees and manages alerts", () => {
  const rule = (id: string, scope: AlertRule["scope"], ownerId: string): AlertRule => ({ ...complete, id, scope, ownerId, ownerName: ownerId, metric: "roas", platform: "meta-ads", condition: "below", threshold: 2.5, delivery: "slack", slackChannel: "#marketing", paused: false, createdAt: "2026-10-01T00:00:00Z" });
  const rules = [rule("w", "workspace", "u_dakota"), rule("mine", "personal", "u_david"), rule("theirs", "personal", "u_troy")];
  const admin = { id: "u_david", role: "admin" as const };
  const member = { id: "u_troy", role: "member" as const };

  test("everyone sees workspace alerts and only their own personal ones", () => {
    expect(visibleAlerts(rules, admin).map((entry) => entry.id)).toEqual(["w", "mine"]);
    expect(visibleAlerts(rules, member).map((entry) => entry.id)).toEqual(["w", "theirs"]);
  });

  test("admins manage workspace alerts; people manage their own", () => {
    expect(canManageAlert(rules[0], admin)).toBe(true);
    expect(canManageAlert(rules[0], member)).toBe(false);
    expect(canManageAlert(rules[2], member)).toBe(true);
  });
});
