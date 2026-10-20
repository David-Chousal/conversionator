"use client";

import { metricLabel } from "@/lib/analytics/metrics";
import type { MetricKey } from "@/lib/analytics/types";
import { platformInfo, type Platform } from "@/lib/data";
import type { AlertDraft, AlertField, AlertSeries } from "@/lib/data/settings-types";
import { currencySymbol } from "@/lib/format";

interface AlertSentenceProps {
  draft: AlertDraft;
  thresholdText: string;
  /** Slots to mark invalid (touched and failing). */
  invalid: AlertField[];
  series: AlertSeries;
  platforms: Platform[];
  onChange: (patch: Partial<AlertDraft>) => void;
  onThreshold: (text: string) => void;
  onLeave: (field: AlertField) => void;
  onLeaveSlack: () => void;
}

const METRICS: readonly MetricKey[] = ["spend", "roas", "cpa", "conversions", "leads", "cpl"];

/** "When [metric] on [channel] [condition] [value] [period], [delivery]." Each slot is a native select or input. */
export function AlertSentence({ draft, thresholdText, invalid, series, platforms, onChange, onThreshold, onLeave, onLeaveSlack }: AlertSentenceProps) {
  const hasCrm = series.source === "crm";
  const personal = draft.scope === "personal";
  const slot = (field: AlertField, empty: boolean, extra = "") => ["cor-slot", extra, empty ? "cor-slot--empty" : "", invalid.includes(field) ? "cor-slot--invalid" : ""].filter(Boolean).join(" ");

  return (
    <p className="cor-sentence">
      <span className="cor-sentence__part">When{" "}
      <select aria-label="Metric" className={slot("metric", !draft.metric)} value={draft.metric ?? ""} onChange={(event) => onChange({ metric: (event.target.value || null) as MetricKey | null })} onBlur={() => onLeave("metric")}>
        <option value="" disabled>metric</option>
        {METRICS.map((key) => {
          const needsCrm = !hasCrm && (key === "leads" || key === "cpl");
          return <option key={key} value={key} disabled={needsCrm}>{metricLabel(key, series.source)}{needsCrm ? " · needs HubSpot" : ""}</option>;
        })}
      </select></span>{" "}
      <span className="cor-sentence__part">on{" "}
      <select aria-label="Channel" className={slot("platform", !draft.platform)} value={draft.platform ?? ""} onChange={(event) => onChange({ platform: (event.target.value || null) as AlertDraft["platform"] })} onBlur={() => onLeave("platform")}>
        <option value="" disabled>channel</option>
        <option value="all">all channels</option>
        {platforms.map((platform) => <option key={platform} value={platform}>{platformInfo(platform).name}</option>)}
      </select></span>{" "}
      <select aria-label="Condition" className={slot("condition", !draft.condition)} value={draft.condition ?? ""} onChange={(event) => onChange({ condition: (event.target.value || null) as AlertDraft["condition"] })} onBlur={() => onLeave("condition")}>
        <option value="" disabled>does what</option>
        <option value="above">rises above</option>
        <option value="below">drops below</option>
        <option value="change">changes by more than</option>
      </select>{" "}
      <span className="cor-slot-number">
        {draft.condition !== "change" && (draft.metric === "spend" || draft.metric === "cpa" || draft.metric === "cpl") && <span aria-hidden="true">{currencySymbol(series.currency)}</span>}
        <input aria-label="Threshold" type="number" inputMode="decimal" min="0" step="any" placeholder="value" className={slot("threshold", thresholdText === "", "cor-slot--num")} value={thresholdText}
          onChange={(event) => onThreshold(event.target.value)} onBlur={() => onLeave("threshold")} />
        {draft.condition === "change" ? <span aria-hidden="true">%</span> : draft.metric === "roas" ? <span aria-hidden="true">×</span> : null}
      </span>{" "}
      <span className="cor-sentence__part"><select aria-label="Period" className="cor-slot" value={draft.period} onChange={(event) => onChange({ period: event.target.value as AlertDraft["period"] })}>
        <option value="day">in a day</option>
        <option value="week">over a week</option>
      </select>,</span>{" "}
      <span className="cor-sentence__part"><select aria-label="Delivery" className={slot("delivery", !draft.delivery)} value={draft.delivery ?? ""} onChange={(event) => onChange({ delivery: (event.target.value || null) as AlertDraft["delivery"] })} onBlur={() => onLeave("delivery")}>
        <option value="" disabled>tell whom</option>
        <option value="inApp">{personal ? "tell me in-app" : "tell the workspace in-app"}</option>
        <option value="email">{personal ? "email me" : "email the admins"}</option>
        <option value="slack">post in Slack</option>
      </select>
      {draft.delivery === "slack" && (
        <>{" "}<input aria-label="Slack channel" placeholder="#channel" className={slot("slackChannel", draft.slackChannel === "", "cor-slot--num cor-slot--channel")} value={draft.slackChannel}
          onChange={(event) => onChange({ slackChannel: event.target.value })} onBlur={onLeaveSlack} /></>
      )}
      .</span>
    </p>
  );
}
