import { metricLabel } from "@/lib/analytics/metrics";
import type { AttributionSource, MetricKey } from "@/lib/analytics/types";
import { formatRoas } from "@/lib/format";
import { platformInfo } from "./catalog";
import type { AlertCondition, AlertPlatform, AlertRule } from "./settings-types";

export interface AlertTextContext {
  source: AttributionSource;
  currency: string;
}

const MONEY_METRICS: readonly MetricKey[] = ["spend", "cpa", "cpl"];
const CONDITION_TEXT: Record<AlertCondition, string> = { above: "rises above", below: "drops below", change: "changes by more than" };

export const platformLabel = (platform: AlertPlatform): string => (platform === "all" ? "all channels" : platformInfo(platform).name);

function money(value: number, currency: string): string {
  const digits = Number.isInteger(value) || value >= 100 ? 0 : 2;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

/** A metric value as the user reads it: money, ×, a count, or a percent for change rules. */
export function formatThreshold(metric: MetricKey, value: number, condition: AlertCondition, currency: string): string {
  if (condition === "change") return `${Math.round(value)}%`;
  if (metric === "roas") return formatRoas(value);
  if (MONEY_METRICS.includes(metric)) return money(value, currency);
  return Math.round(value).toLocaleString("en-US");
}

/** One more level of detail, for values that round to the threshold itself. */
function precise(metric: MetricKey, value: number, currency: string): string {
  if (metric === "roas") return `${value.toFixed(2)}×`;
  if (MONEY_METRICS.includes(metric)) return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function deliveryText(rule: Pick<AlertRule, "delivery" | "slackChannel" | "scope">): string {
  if (rule.delivery === "slack") return `post in ${rule.slackChannel} on Slack`;
  if (rule.scope === "personal") return rule.delivery === "email" ? "email me" : "tell me in-app";
  return rule.delivery === "email" ? "email the admins" : "tell the workspace in-app";
}

export function alertSentence(rule: AlertRule, context: AlertTextContext): string {
  const threshold = formatThreshold(rule.metric, rule.threshold, rule.condition, context.currency);
  const period = rule.period === "day" ? "in a day" : "over a week";
  return `When ${metricLabel(rule.metric, context.source)} on ${platformLabel(rule.platform)} ${CONDITION_TEXT[rule.condition]} ${threshold} ${period}, ${deliveryText(rule)}.`;
}

/** What happened, with numbers: "ROAS on Meta Ads dropped to 2.1× (below 2.5×)". */
export function firingHeadline(rule: AlertRule, firing: { value: number; previous: number | null }, context: AlertTextContext): string {
  const subject = `${metricLabel(rule.metric, context.source)} on ${platformLabel(rule.platform)}`;
  const limit = formatThreshold(rule.metric, rule.threshold, rule.condition, context.currency);
  if (rule.condition === "change" && firing.previous) {
    const change = ((firing.value - firing.previous) / firing.previous) * 100;
    return `${subject} ${change >= 0 ? "rose" : "fell"} ${Math.round(Math.abs(change))}% (more than ${limit})`;
  }
  const rounded = formatThreshold(rule.metric, firing.value, rule.condition, context.currency);
  const value = rounded === limit ? precise(rule.metric, firing.value, context.currency) : rounded;
  return rule.condition === "above" ? `${subject} rose to ${value} (above ${limit})` : `${subject} dropped to ${value} (below ${limit})`;
}
