import type { IsoDate } from "@/lib/analytics/dates";
import type { MetricKey } from "@/lib/analytics/types";
import type { Platform, Role } from "@/lib/data/types";

export type RollingDays = 7 | 30 | 90;
export type ReportWindow = { kind: "rolling"; days: RollingDays } | { kind: "last-month" } | { kind: "custom"; from: IsoDate; to: IsoDate };
export type ReportFormat = "pdf" | "csv";
export type ReportSchedule = "none" | "weekly" | "monthly";

/** What the composer edits. */
export interface ReportInput {
  name: string;
  metrics: MetricKey[];
  platforms: Platform[];
  window: ReportWindow;
  /** Show each summary metric against the previous period of the same length. */
  compare: boolean;
  format: ReportFormat;
  schedule: ReportSchedule;
  /** Only used when scheduled. */
  recipients: string[];
}

export interface Report extends ReportInput {
  id: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export type ReportField = "name" | "metrics" | "platforms" | "window" | "recipients";
export type ReportErrors = Partial<Record<ReportField, string>>;

export interface ReportContext {
  /** Channels with data that a report can include. */
  available: Platform[];
  today: IsoDate;
}

export interface ReportActor {
  id: string;
  name: string;
  role: Role;
}

/** A finished report: what the preview, the PDF and the CSV all show. Values are raw; each output formats them. */
export interface ReportContent {
  title: string;
  from: IsoDate;
  to: IsoDate;
  windowLabel: string;
  previousLabel: string | null;
  sourceLabel: string;
  channelNames: string[];
  currency: string;
  generatedOn: string;
  metrics: { key: MetricKey; label: string }[];
  summary: { key: MetricKey; label: string; value: string; change: string | null; tone: "good" | "bad" | "flat" }[];
  byChannel: { name: string; code: string; values: (number | null)[] }[];
  total: (number | null)[];
  /** Every campaign, by spend. */
  campaigns: { name: string; channel: string; values: (number | null)[] }[];
  empty: boolean;
}
