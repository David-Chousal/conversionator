import type { IsoDate } from "@/lib/analytics/dates";
import type { AttributionSource, MetricKey, Totals } from "@/lib/analytics/types";
import type { Platform, Role } from "./types";

export type RangeDays = 7 | 30 | 90;
export type WeekStart = "monday" | "sunday";

/** Personal settings: who you are and what Analytics opens to. */
export interface ProfileInput {
  name: string;
  defaultRangeDays: RangeDays;
}

export interface Preferences {
  defaultRangeDays: RangeDays;
}

/** Workspace settings, admins only: the same for everyone so numbers match. */
export interface WorkspaceInput {
  name: string;
  currency: string;
  timeZone: string;
  weekStart: WeekStart;
}

export type NotificationEvent = "alerts" | "sync" | "team" | "summary";
export type NotificationChannel = "inApp" | "email";
export type NotificationPrefs = Record<NotificationEvent, Record<NotificationChannel, boolean>>;

export type AlertCondition = "above" | "below" | "change";
export type AlertPeriod = "day" | "week";
export type AlertDelivery = "inApp" | "email" | "slack";
export type AlertScope = "personal" | "workspace";
export type AlertPlatform = Platform | "all";

/** An alert being written: slots stay null until the user fills them. */
export interface AlertDraft {
  metric: MetricKey | null;
  platform: AlertPlatform | null;
  condition: AlertCondition | null;
  threshold: number | null;
  period: AlertPeriod;
  delivery: AlertDelivery | null;
  slackChannel: string;
  scope: AlertScope;
}

export interface AlertRule {
  id: string;
  metric: MetricKey;
  platform: AlertPlatform;
  condition: AlertCondition;
  threshold: number;
  period: AlertPeriod;
  delivery: AlertDelivery;
  slackChannel: string | null;
  scope: AlertScope;
  ownerId: string;
  ownerName: string;
  paused: boolean;
  createdAt: string;
}

export type AlertField = "metric" | "platform" | "condition" | "threshold" | "delivery" | "slackChannel";
export type AlertErrors = Partial<Record<AlertField, string>>;

export interface AlertActor {
  id: string;
  role: Role;
}

/** One channel's totals on one day, for checking alerts. */
export interface AlertDay {
  date: IsoDate;
  platform: Platform;
  totals: Totals;
}

export interface AlertSeries {
  source: AttributionSource;
  currency: string;
  today: IsoDate;
  days: AlertDay[];
}

export interface AlertFiring {
  ruleId: string;
  date: IsoDate;
  value: number;
  /** The previous period's value, for change rules. */
  previous: number | null;
}
