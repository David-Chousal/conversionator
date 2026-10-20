import { describe, expect, test } from "vitest";
import { createSettingsStore } from "./settings-store";
import type { AlertDraft } from "./settings-types";
import type { User } from "./types";

const NOW = Date.parse("2026-10-18T12:00:00Z");
const admin: User = { id: "u_david", name: "David Chousal", email: "d@x.co", role: "admin" as const, initials: "DC" };
const member = { ...admin, id: "u_troy", name: "Troy Edwards", role: "member" as const, initials: "TE" };
const store = (user = admin) => createSettingsStore(() => NOW, user);
const draft: AlertDraft = { metric: "spend", platform: "all", condition: "above", threshold: 2000, period: "day", delivery: "email", slackChannel: "", scope: "personal" };
const ctx = { hasCrm: true };

describe("settings store", () => {
  test("updates the profile and the default range", () => {
    const settings = store();
    settings.updateProfile({ name: "  David C  ", defaultRangeDays: 7 });
    expect(settings.user().name).toBe("David C");
    expect(settings.user().initials).toBe("DC");
    expect(settings.preferences().defaultRangeDays).toBe(7);
  });

  test("rejects an invalid profile with the first problem", () => {
    expect(() => store().updateProfile({ name: "", defaultRangeDays: 30 })).toThrow("Enter your name.");
  });

  test("updates the workspace", () => {
    const settings = store();
    settings.updateWorkspace({ name: "Northwind Labs", currency: "EUR", timeZone: "Europe/London", weekStart: "sunday" });
    expect(settings.workspace()).toMatchObject({ name: "Northwind Labs", currency: "EUR", timeZone: "Europe/London", weekStart: "sunday" });
  });

  test("keeps notification preferences, ignoring channels an event doesn't offer", () => {
    const settings = store();
    const next = { ...settings.notifications(), summary: { inApp: true, email: false } };
    settings.updateNotifications(next);
    expect(settings.notifications().summary).toEqual({ inApp: false, email: false });
  });

  test("shows workspace alerts and your own, never someone else's personal ones", () => {
    const ids = store().alerts().map((rule) => rule.id);
    expect(ids).toContain("a_roas_meta");
    expect(ids).not.toContain("a_troy_spend");
  });

  test("creates, edits, pauses and deletes an alert", () => {
    const settings = store();
    const created = settings.createAlert(draft, ctx);
    expect(created).toMatchObject({ ownerId: "u_david", paused: false, slackChannel: null });
    settings.updateAlert(created.id, { ...draft, threshold: 2500 }, ctx);
    settings.setAlertPaused(created.id, true);
    expect(settings.alerts().find((rule) => rule.id === created.id)).toMatchObject({ threshold: 2500, paused: true });
    settings.deleteAlert(created.id);
    expect(settings.alerts().some((rule) => rule.id === created.id)).toBe(false);
  });

  test("refuses invalid drafts with every problem", () => {
    expect(() => store().createAlert({ ...draft, threshold: null, delivery: null }, ctx)).toThrow("Enter a threshold. Pick how to tell you.");
  });

  test("members can't create or change workspace alerts", () => {
    const settings = store(member);
    expect(() => settings.createAlert({ ...draft, scope: "workspace" }, ctx)).toThrow("Only admins can create workspace alerts.");
    expect(() => settings.setAlertPaused("a_roas_meta", true)).toThrow("Only admins can change workspace alerts.");
  });
});
