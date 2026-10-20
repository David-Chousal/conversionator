import type { MetricKey } from "@/lib/analytics/types";
import type { AlertActor, AlertDraft, AlertErrors, AlertRule, AlertScope } from "./settings-types";

const CRM_METRICS: readonly MetricKey[] = ["leads", "cpl"];
const COUNT_METRICS: readonly MetricKey[] = ["leads", "conversions"];
const SLACK_CHANNEL = /^#[a-z0-9][a-z0-9_-]{0,79}$/;
const MAX_CHANGE = 1000;

export function emptyDraft(scope: AlertScope): AlertDraft {
  return { metric: null, platform: null, condition: null, threshold: null, period: "day", delivery: null, slackChannel: "", scope };
}

export function draftOf(rule: AlertRule): AlertDraft {
  const { metric, platform, condition, threshold, period, delivery, scope } = rule;
  return { metric, platform, condition, threshold, period, delivery, slackChannel: rule.slackChannel ?? "", scope };
}

function thresholdError(draft: AlertDraft): string | null {
  const { threshold, condition, metric } = draft;
  if (threshold === null || !Number.isFinite(threshold)) return "Enter a threshold.";
  if (threshold <= 0) return "Use a number above 0.";
  if (condition === "change") return threshold < 1 || threshold > MAX_CHANGE ? "Use a change between 1% and 1,000%." : null;
  if (metric && COUNT_METRICS.includes(metric) && !Number.isInteger(threshold)) return "Use a whole number.";
  return null;
}

/** Every unfilled or invalid slot, keyed by slot, in sentence order. */
export function validateAlertDraft(draft: AlertDraft, context: { hasCrm: boolean }): AlertErrors {
  const errors: AlertErrors = {};
  if (!draft.metric) errors.metric = "Pick a metric.";
  else if (CRM_METRICS.includes(draft.metric) && !context.hasCrm) errors.metric = "Leads come from your CRM. Connect HubSpot to alert on them.";
  if (!draft.platform) errors.platform = "Pick a channel or all channels.";
  if (!draft.condition) errors.condition = "Pick a condition.";
  const threshold = thresholdError(draft);
  if (threshold) errors.threshold = threshold;
  if (!draft.delivery) errors.delivery = "Pick how to tell you.";
  else if (draft.delivery === "slack" && !SLACK_CHANNEL.test(draft.slackChannel.trim())) errors.slackChannel = "Use a Slack channel like #marketing.";
  return errors;
}

/** Workspace alerts plus the actor's own personal ones. */
export function visibleAlerts(rules: AlertRule[], actor: AlertActor): AlertRule[] {
  return rules.filter((rule) => rule.scope === "workspace" || rule.ownerId === actor.id);
}

export function canManageAlert(rule: AlertRule, actor: AlertActor): boolean {
  return rule.scope === "workspace" ? actor.role === "admin" : rule.ownerId === actor.id;
}
