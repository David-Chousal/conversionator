import type { MetricKey } from "@/lib/analytics/types";
import { PLATFORMS } from "@/lib/data/catalog";
import type { Platform } from "@/lib/data/types";
import { MAX_RECIPIENTS } from "./rules";
import type { ReportInput, ReportWindow } from "./types";

// Server actions and the export route receive whatever the browser sends; this coerces it. validateReport checks meaning.
type Loose = Record<string, unknown>;

const METRICS: readonly MetricKey[] = ["spend", "roas", "cpa", "conversions", "leads", "cpl"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const object = (value: unknown): Loose => (typeof value === "object" && value !== null ? (value as Loose) : {});
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value.slice(0, 50) : []);
const date = (value: unknown) => (typeof value === "string" && ISO_DATE.test(value) ? value : "");

function parseWindow(value: unknown): ReportWindow {
  const input = object(value);
  if (input.kind === "last-month") return { kind: "last-month" };
  if (input.kind === "custom") return { kind: "custom", from: date(input.from), to: date(input.to) };
  const days = input.days === 7 || input.days === 90 ? input.days : 30;
  return { kind: "rolling", days };
}

export function parseReportInput(value: unknown): ReportInput {
  const input = object(value);
  const platforms = PLATFORMS.map((entry) => entry.platform);
  return {
    name: typeof input.name === "string" ? input.name.slice(0, 200) : "",
    metrics: [...new Set(list(input.metrics).filter((entry): entry is MetricKey => METRICS.includes(entry as MetricKey)))],
    platforms: [...new Set(list(input.platforms).filter((entry): entry is Platform => platforms.includes(entry as Platform)))],
    window: parseWindow(input.window),
    compare: input.compare === true,
    format: input.format === "csv" ? "csv" : "pdf",
    schedule: input.schedule === "weekly" || input.schedule === "monthly" ? input.schedule : "none",
    recipients: list(input.recipients).filter((entry): entry is string => typeof entry === "string").slice(0, MAX_RECIPIENTS + 1).map((entry) => entry.slice(0, 254)),
  };
}
