"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { addDays } from "@/lib/analytics/dates";
import { HISTORY_DAYS } from "@/lib/analytics/filter";
import type { MetricKey } from "@/lib/analytics/types";
import type { Platform } from "@/lib/data/types";
import type { ComposerData } from "@/lib/reports/loader";
import type { ReportErrors, ReportInput, ReportWindow } from "@/lib/reports/types";
import { nextSend, scheduleLabel } from "@/lib/reports/window";
import { formatDay } from "@/lib/analytics/dates";
import { RecipientsInput } from "./RecipientsInput";

interface StepsProps {
  input: ReportInput;
  errors: ReportErrors;
  data: Pick<ComposerData, "channels" | "metrics" | "weekStart" | "today">;
  onChange: (patch: Partial<ReportInput>) => void;
}

function Step({ number, title, error, children }: { number: number; title: string; error?: string; children: ReactNode }) {
  return (
    <fieldset className="cor-step cor-report-step">
      <legend className="cor-tag">{number} · {title}</legend>
      {children}
      {error && <span className="cor-help cor-help--error"><Icon name="warning" />{error}</span>}
    </fieldset>
  );
}

function Seg<T extends string>({ label, name, value, options, onPick }: { label: string; name: string; value: T; options: { value: T; label: string }[]; onPick: (value: T) => void }) {
  return (
    <span className="cor-seg cor-seg--radio" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value}><input className="cor-visually-hidden" type="radio" name={name} checked={value === option.value} onChange={() => onPick(option.value)} /><span>{option.label}</span></label>
      ))}
    </span>
  );
}

const toggle = <T,>(list: T[], item: T): T[] => (list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item]);
const WINDOWS: { id: string; label: string; window: (today: string) => ReportWindow }[] = [
  { id: "7", label: "Last 7 days", window: () => ({ kind: "rolling", days: 7 }) },
  { id: "30", label: "Last 30 days", window: () => ({ kind: "rolling", days: 30 }) },
  { id: "90", label: "Last 90 days", window: () => ({ kind: "rolling", days: 90 }) },
  { id: "last-month", label: "Last month", window: () => ({ kind: "last-month" }) },
  { id: "custom", label: "Custom", window: (today) => ({ kind: "custom", from: addDays(today, -13), to: today }) },
];
const windowId = (window: ReportWindow) => (window.kind === "rolling" ? String(window.days) : window.kind);

export function MetricsStep({ input, errors, data, onChange }: StepsProps) {
  return (
    <Step number={1} title="Metrics" error={errors.metrics}>
      <span className="cor-report-checks">
        {data.metrics.map((metric) => (
          <label key={metric.key} className="cor-check"><input type="checkbox" disabled={metric.needsCrm} checked={input.metrics.includes(metric.key)} onChange={() => onChange({ metrics: toggle<MetricKey>(input.metrics, metric.key) })} /><span>{metric.label}{metric.needsCrm ? " · needs HubSpot" : ""}</span></label>
        ))}
      </span>
    </Step>
  );
}

export function SourcesStep({ input, errors, data, onChange }: StepsProps) {
  return (
    <Step number={2} title="Channels" error={errors.platforms}>
      <span className="cor-report-checks">
        {data.channels.map((channel) => (
          <label key={channel.platform} className="cor-check"><input type="checkbox" checked={input.platforms.includes(channel.platform)} onChange={() => onChange({ platforms: toggle<Platform>(input.platforms, channel.platform) })} /><span>{channel.name}</span></label>
        ))}
      </span>
    </Step>
  );
}

export function WindowStep({ input, errors, data, onChange }: StepsProps) {
  const { window } = input;
  const group = useId();
  return (
    <Step number={3} title="Window" error={errors.window}>
      <span className="cor-report-checks">
        {WINDOWS.map((option) => (
          <label key={option.id} className="cor-check"><input type="radio" name={`${group}-window`} checked={windowId(window) === option.id} onChange={() => onChange({ window: option.window(data.today) })} /><span>{option.label}</span></label>
        ))}
      </span>
      {window.kind === "custom" && (
        <span className="cor-report-dates">
          <label className="cor-fieldset"><span className="cor-tag">From</span><input className="cor-input cor-input--mono" type="date" value={window.from} min={addDays(data.today, -(HISTORY_DAYS - 1))} max={data.today} onChange={(event) => onChange({ window: { ...window, from: event.target.value } })} /></label>
          <label className="cor-fieldset"><span className="cor-tag">To</span><input className="cor-input cor-input--mono" type="date" value={window.to} min={addDays(data.today, -(HISTORY_DAYS - 1))} max={data.today} onChange={(event) => onChange({ window: { ...window, to: event.target.value } })} /></label>
        </span>
      )}
      <label className="cor-check"><input type="checkbox" checked={input.compare} onChange={() => onChange({ compare: !input.compare })} /><span>Compare with the previous period</span></label>
    </Step>
  );
}

export function DeliverStep({ input, errors, data, onChange, showRecipientsError }: StepsProps & { showRecipientsError: boolean }) {
  const label = scheduleLabel(input.schedule, data.weekStart);
  const next = nextSend(input.schedule, data.weekStart, data.today);
  const group = useId();
  return (
    <Step number={4} title="Deliver">
      <span className="cor-row" style={{ gap: "var(--space-3)", flexWrap: "wrap" }}>
        <Seg label="Format" name={`${group}-format`} value={input.format} options={[{ value: "pdf", label: "PDF" }, { value: "csv", label: "CSV" }]} onPick={(format) => onChange({ format })} />
        <Seg label="Schedule" name={`${group}-schedule`} value={input.schedule} options={[{ value: "none", label: "Once" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }]} onPick={(schedule) => onChange({ schedule })} />
      </span>
      <span className="cor-help">{label && next ? `${label}, workspace time. First send ${formatDay(next)}.` : "Export it now. Schedule it to email it every week or month."}</span>
      {input.schedule !== "none" && <RecipientsInput value={input.recipients} onChange={(recipients) => onChange({ recipients })} error={showRecipientsError ? errors.recipients : undefined} />}
    </Step>
  );
}
