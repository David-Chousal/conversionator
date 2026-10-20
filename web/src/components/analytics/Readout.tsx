import type { CSSProperties } from "react";
import { readoutView } from "@/lib/analytics/readout-view";
import type { ReadoutData } from "@/lib/analytics/types";
import { DrillButton } from "./drill/DrillButton";

interface ReadoutProps {
  data: ReadoutData;
  currency: string;
  windowDays: number;
  scope: string;
  /** Make the whole tile open the drill-down drawer (inside a DrillProvider). */
  drill?: boolean;
}

const SLOPE_HALF_LENGTH = 8;

function slopePath(degrees: number): string {
  const radians = (degrees * Math.PI) / 180;
  const dx = SLOPE_HALF_LENGTH * Math.cos(radians);
  const dy = SLOPE_HALF_LENGTH * Math.sin(radians);
  return `M${(9 - dx).toFixed(1)} ${(6 + dy).toFixed(1)} L${(9 + dx).toFixed(1)} ${(6 - dy).toFixed(1)}`;
}

/** One headline metric: value, slope against the previous period, and its 90-day range. */
export function Readout({ data, currency, windowDays, scope, drill = false }: ReadoutProps) {
  const view = readoutView(data, currency);
  return (
    <section className={drill ? "cor-bay cor-bay--drill" : "cor-bay"} aria-label={view.label}>
      <div className="cor-bay__head cor-readout__head">
        <span className="cor-readout__name">
          <span className="cor-tag" title={view.label}>{view.label}</span>
          {view.sourceLabel && <span className="cor-badge cor-badge--muted">{view.sourceLabel}</span>}
        </span>
        <span className="cor-tag">{scope}</span>
      </div>
      <div className="cor-readout__value">{view.main}{view.small && <small>{view.small}</small>}</div>
      {view.change ? (
        <span className={`cor-slope cor-slope--${view.tone}`}>
          <svg viewBox="0 0 18 12" aria-hidden="true"><path d={slopePath(view.slopeDegrees)} /></svg>
          {view.change} <span>vs prev {windowDays}d</span>
        </span>
      ) : (
        <span className="cor-tag">No earlier data to compare</span>
      )}
      {view.rangeMin && view.rangeMax && view.nowPercent !== null && (
        <div className="cor-range" role="img" aria-label={`90-day range ${view.rangeMin} to ${view.rangeMax}`}>
          {view.previousPercent !== null && <i className="cor-range__prev" style={{ left: `${view.previousPercent}%` } as CSSProperties} />}
          <i className="cor-range__now" style={{ left: `${view.nowPercent}%` } as CSSProperties} />
          <span className="cor-range__ends"><span>{view.rangeMin}</span><span>90-day range</span><span>{view.rangeMax}</span></span>
        </div>
      )}
      {drill && <DrillButton target={{ metric: data.key, platform: null, campaignId: null, bucket: null }} label={`Open ${view.label} breakdown`} className="cor-stretch" />}
    </section>
  );
}
