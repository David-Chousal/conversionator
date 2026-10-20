import { DataSourceError } from "./errors";
import { canManageAlert, validateAlertDraft, visibleAlerts } from "./alert-rules";
import { initialsOf, validateProfile, validateWorkspaceInput } from "./settings-rules";
import type { AlertDraft, AlertRule, NotificationChannel, NotificationEvent, NotificationPrefs, Preferences, ProfileInput, WorkspaceInput } from "./settings-types";
import type { User, Workspace } from "./types";

/** Which channels each notification can use: the weekly summary is email only. */
export const NOTIFICATION_CHANNELS: Record<NotificationEvent, readonly NotificationChannel[]> = {
  alerts: ["inApp", "email"], sync: ["inApp", "email"], team: ["inApp", "email"], summary: ["email"],
};

const DEFAULT_WORKSPACE: Workspace = { id: "ws_northwind", name: "Northwind", currency: "USD", timeZone: "America/Los_Angeles", weekStart: "monday" };
const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  alerts: { inApp: true, email: true }, sync: { inApp: true, email: true }, team: { inApp: true, email: false }, summary: { inApp: false, email: true },
};
const DAY_MS = 86_400_000;

function seedAlerts(now: number): AlertRule[] {
  const at = (daysAgo: number) => new Date(now - daysAgo * DAY_MS).toISOString();
  const base = { period: "day" as const, slackChannel: null, paused: false };
  return [
    { ...base, id: "a_roas_meta", metric: "roas", platform: "meta-ads", condition: "below", threshold: 2.5, delivery: "slack", slackChannel: "#marketing", scope: "workspace", ownerId: "u_dakota", ownerName: "Dakota Goldstein", createdAt: at(40) },
    { ...base, id: "a_spend_all", metric: "spend", platform: "all", condition: "above", threshold: 1900, delivery: "email", scope: "workspace", ownerId: "u_david", ownerName: "David Chousal", createdAt: at(32) },
    { ...base, id: "a_cpl_linkedin", metric: "cpl", platform: "linkedin-ads", condition: "above", threshold: 60, period: "week", delivery: "email", scope: "personal", ownerId: "u_david", ownerName: "David Chousal", createdAt: at(20) },
    { ...base, id: "a_leads_google", metric: "leads", platform: "google-ads", condition: "change", threshold: 25, period: "week", delivery: "inApp", scope: "personal", ownerId: "u_david", ownerName: "David Chousal", paused: true, createdAt: at(12) },
    { ...base, id: "a_troy_spend", metric: "spend", platform: "tiktok-ads", condition: "above", threshold: 400, delivery: "inApp", scope: "personal", ownerId: "u_troy", ownerName: "Troy Edwards", createdAt: at(8) },
  ];
}

function invalid(errors: Record<string, string | undefined>): never {
  throw new DataSourceError("invalid_input", Object.values(errors).filter(Boolean).join(" "));
}

export function createSettingsStore(now: () => number, actingUser: User) {
  let workspace = DEFAULT_WORKSPACE;
  let user = actingUser;
  let preferences: Preferences = { defaultRangeDays: 30 };
  let notifications = DEFAULT_NOTIFICATIONS;
  let alerts = seedAlerts(now());
  let nextId = 1;

  function find(id: string): AlertRule {
    const rule = alerts.find((entry) => entry.id === id && visibleAlerts([entry], user).length > 0);
    if (!rule) throw new DataSourceError("not_found", "That alert no longer exists.");
    if (!canManageAlert(rule, user)) throw new DataSourceError("not_found", rule.scope === "workspace" ? "Only admins can change workspace alerts." : "Only its owner can change this alert.");
    return rule;
  }

  function checked(draft: AlertDraft, context: { hasCrm: boolean }) {
    const errors = validateAlertDraft(draft, context);
    if (Object.keys(errors).length > 0) invalid(errors);
    if (draft.scope === "workspace" && user.role !== "admin") throw new DataSourceError("invalid_input", "Only admins can create workspace alerts.");
    // Validated above, so every slot is filled.
    const { metric, platform, condition, threshold, period, delivery, scope } = draft as AlertRule & AlertDraft;
    return { metric, platform, condition, threshold, period, delivery, scope, slackChannel: delivery === "slack" ? draft.slackChannel.trim() : null };
  }

  return {
    workspace: () => workspace,
    user: () => user,
    preferences: () => preferences,
    notifications: () => notifications,
    alerts: () => visibleAlerts(alerts, user),
    updateProfile(input: ProfileInput) {
      const errors = validateProfile(input);
      if (Object.keys(errors).length > 0) invalid(errors);
      const name = input.name.trim();
      user = { ...user, name, initials: initialsOf(name) };
      preferences = { ...preferences, defaultRangeDays: input.defaultRangeDays };
    },
    updateWorkspace(input: WorkspaceInput) {
      const errors = validateWorkspaceInput(input);
      if (Object.keys(errors).length > 0) invalid(errors);
      workspace = { ...workspace, ...input, name: input.name.trim() };
    },
    updateNotifications(prefs: NotificationPrefs) {
      const events = Object.keys(NOTIFICATION_CHANNELS) as NotificationEvent[];
      notifications = Object.fromEntries(events.map((event) => [event, {
        inApp: NOTIFICATION_CHANNELS[event].includes("inApp") && prefs[event]?.inApp === true,
        email: NOTIFICATION_CHANNELS[event].includes("email") && prefs[event]?.email === true,
      }])) as NotificationPrefs;
    },
    createAlert(draft: AlertDraft, context: { hasCrm: boolean }): AlertRule {
      const rule: AlertRule = { ...checked(draft, context), id: `a_${now().toString(36)}_${nextId++}`, ownerId: user.id, ownerName: user.name, paused: false, createdAt: new Date(now()).toISOString() };
      alerts = [rule, ...alerts];
      return rule;
    },
    updateAlert(id: string, draft: AlertDraft, context: { hasCrm: boolean }): AlertRule {
      const updated = { ...find(id), ...checked(draft, context) };
      alerts = alerts.map((rule) => (rule.id === id ? updated : rule));
      return updated;
    },
    setAlertPaused(id: string, paused: boolean) {
      find(id);
      alerts = alerts.map((rule) => (rule.id === id ? { ...rule, paused } : rule));
    },
    deleteAlert(id: string) {
      find(id);
      alerts = alerts.filter((rule) => rule.id !== id);
    },
  };
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;
