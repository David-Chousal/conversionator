import type { MetricKey } from "@/lib/analytics/types";
import { PLATFORMS } from "./catalog";
import type { AlertDraft, AlertPlatform, NotificationPrefs, ProfileInput, RangeDays, WorkspaceInput } from "./settings-types";

// Server actions receive whatever the browser sends; these coerce it into typed input. The store validates meaning.
type Loose = Record<string, unknown>;

const METRICS: readonly MetricKey[] = ["spend", "roas", "cpa", "conversions", "leads", "cpl"];
const object = (value: unknown): Loose => (typeof value === "object" && value !== null ? (value as Loose) : {});
const text = (value: unknown, max = 200): string => (typeof value === "string" ? value.slice(0, max) : "");
const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | null => (options.includes(value as T) ? (value as T) : null);

export function parseProfile(value: unknown): ProfileInput {
  const input = object(value);
  return { name: text(input.name), defaultRangeDays: Number(input.defaultRangeDays) as RangeDays };
}

export function parseWorkspaceInput(value: unknown): WorkspaceInput {
  const input = object(value);
  return { name: text(input.name), currency: text(input.currency, 8), timeZone: text(input.timeZone, 64), weekStart: oneOf(input.weekStart, ["monday", "sunday"]) ?? ("" as never) };
}

export function parseNotifications(value: unknown): NotificationPrefs {
  const input = object(value);
  const channels = (event: string) => ({ inApp: object(input[event]).inApp === true, email: object(input[event]).email === true });
  return { alerts: channels("alerts"), sync: channels("sync"), team: channels("team"), summary: channels("summary") };
}

export function parseAlertDraft(value: unknown): AlertDraft {
  const input = object(value);
  const platforms: readonly AlertPlatform[] = ["all", ...PLATFORMS.map((entry) => entry.platform)];
  const threshold = typeof input.threshold === "number" && Number.isFinite(input.threshold) ? input.threshold : null;
  return {
    metric: oneOf(input.metric, METRICS),
    platform: oneOf(input.platform, platforms),
    condition: oneOf(input.condition, ["above", "below", "change"]),
    threshold,
    period: oneOf(input.period, ["day", "week"]) ?? "day",
    delivery: oneOf(input.delivery, ["inApp", "email", "slack"]),
    slackChannel: text(input.slackChannel, 81),
    scope: oneOf(input.scope, ["personal", "workspace"]) ?? "personal",
  };
}
