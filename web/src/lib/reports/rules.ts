import { addDays, formatDay } from "@/lib/analytics/dates";
import { HISTORY_DAYS } from "@/lib/analytics/filter";
import { READOUT_KEYS } from "@/lib/analytics/metrics";
import type { AttributionSource } from "@/lib/analytics/types";
import { platformInfo } from "@/lib/data/catalog";
import type { Platform } from "@/lib/data/types";
import type { ReportContext, ReportErrors, ReportInput } from "./types";

export const MAX_RECIPIENTS = 20;
const MAX_NAME = 80;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emptyReport(source: AttributionSource, platforms: Platform[]): ReportInput {
  return { name: "", metrics: [...READOUT_KEYS[source]], platforms, window: { kind: "rolling", days: 30 }, compare: true, format: "pdf", schedule: "none", recipients: [] };
}

function windowError(input: ReportInput, context: ReportContext): string | null {
  const { window } = input;
  if (window.kind !== "custom") return null;
  if (input.schedule !== "none") return "Scheduled reports use a rolling window, like Last 30 days.";
  const earliest = addDays(context.today, -(HISTORY_DAYS - 1));
  if (window.from > window.to) return "The start date is after the end date.";
  if (window.from < earliest) return `COR keeps ${HISTORY_DAYS} days of history. Start on or after ${formatDay(earliest, true)}.`;
  if (window.to > context.today) return "End on or before today.";
  return null;
}

function recipientsError(input: ReportInput): string | null {
  if (input.schedule === "none") return null;
  if (input.recipients.length === 0) return "Add at least one recipient.";
  if (input.recipients.length > MAX_RECIPIENTS) return `Send to at most ${MAX_RECIPIENTS} people.`;
  const bad = input.recipients.find((email) => !EMAIL.test(email));
  return bad ? `${bad} isn't a full email address.` : null;
}

function platformsError(input: ReportInput, context: ReportContext): string | null {
  if (input.platforms.length === 0) return "Pick at least one channel.";
  const gone = input.platforms.find((platform) => !context.available.includes(platform));
  return gone ? `${platformInfo(gone).name} isn't connected anymore. Remove it or reconnect it.` : null;
}

/** Every problem with a report, keyed by composer step. */
export function validateReport(input: ReportInput, context: ReportContext): ReportErrors {
  const name = input.name.trim();
  const errors: ReportErrors = {};
  if (name === "") errors.name = "Name the report.";
  else if (name.length > MAX_NAME) errors.name = `Keep the name under ${MAX_NAME} characters.`;
  if (input.metrics.length === 0) errors.metrics = "Pick at least one metric.";
  const platforms = platformsError(input, context);
  if (platforms) errors.platforms = platforms;
  const window = windowError(input, context);
  if (window) errors.window = window;
  const recipients = recipientsError(input);
  if (recipients) errors.recipients = recipients;
  return errors;
}
