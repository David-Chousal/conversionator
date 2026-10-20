"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Banner } from "@/components/feedback/Banner";
import { formatDay } from "@/lib/analytics/dates";
import { nudgeLabels, traceGeometry } from "@/lib/analytics/trace-geometry";
import type { Trace } from "@/lib/analytics/types";
import { formatMoney } from "@/lib/format";
import { channelColor } from "./color";
import { useDrill } from "./drill/context";

interface TracePanelProps {
  trace: Trace;
  currency: string;
  rangeLabel: string;
}

const HEIGHT = 240;
const MIN_WIDTH = 480;
const LABEL_GAP = 28;
const MAX_X_LABELS = 5;
const TIP_WIDTH = 168;

function useWidth(fallback: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(MIN_WIDTH, Math.round(entry.contentRect.width))));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}

function labelIndexes(count: number): number[] {
  if (count <= MAX_X_LABELS) return Array.from({ length: count }, (_, i) => i);
  return Array.from({ length: MAX_X_LABELS }, (_, i) => Math.round((i * (count - 1)) / (MAX_X_LABELS - 1)));
}

/** Spend per channel over the window, labelled at the line ends, with a keyboard-driven crosshair. */
export function TracePanel({ trace, currency, rangeLabel }: TracePanelProps) {
  const { ref, width } = useWidth(760);
  const [hover, setHover] = useState<number | null>(null);
  const drill = useDrill();
  const count = trace.bucketStarts.length;
  const geometry = traceGeometry({ seriesValues: trace.series.map((series) => series.values), width, height: HEIGHT });
  const { plot } = geometry;
  const money = (value: number) => formatMoney(value, { currency });
  const totals = trace.series.map((series) => series.values.reduce<number>((sum, value) => sum + (value ?? 0), 0));
  const primary = totals.indexOf(Math.max(...totals));
  const endpoints = geometry.endpoints;
  const labelYs = nudgeLabels(endpoints.map((point) => point?.y ?? plot.bottom), LABEL_GAP, plot.top + 8, plot.bottom);
  const weekly = trace.granularity === "week";
  const bucketLabel = (i: number) => `${weekly ? "WK OF " : ""}${formatDay(trace.bucketStarts[i]).toUpperCase()}`;
  const stale = trace.series.filter((series) => series.stale);
  const summary = `${weekly ? "Weekly" : "Daily"} spend by channel, ${rangeLabel}. ${trace.series
    .map((series, i) => (endpoints[i] ? `${series.name} ends at ${money(endpoints[i]!.value)}` : `${series.name} has no data`))
    .join("; ")}.${drill ? " Use the arrow keys to step through points; press Enter to see the campaigns behind it." : ""}`;

  function openBreakdown() {
    if (drill && hover !== null) drill.open({ metric: "spend", platform: null, campaignId: null, bucket: hover });
  }

  function onKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === "Escape") return setHover(null);
    if (event.key === "Enter") return openBreakdown();
    const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
    if (step === 0) return;
    event.preventDefault();
    setHover((current) => (current === null ? count - 1 : Math.min(count - 1, Math.max(0, current + step))));
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    const step = count > 1 ? (plot.right - plot.left) / (count - 1) : 1;
    setHover(Math.min(count - 1, Math.max(0, Math.round((x - plot.left) / step))));
  }

  const hoverTotal = hover === null ? 0 : trace.series.reduce((sum, series) => sum + (series.values[hover] ?? 0), 0);
  const tipX = hover === null ? 0 : Math.min(geometry.x(hover) + 8, plot.right - TIP_WIDTH);

  return (
    <section className="cor-bay" aria-label="Spend by channel">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">Spend by channel</h2>
        <span className="cor-tag">{weekly ? "Weekly" : "Daily"} · {rangeLabel}</span>
      </div>
      {stale.map((series) => (
        <Banner key={series.platform}><strong>{series.name} {series.staleAge ? `is ${series.staleAge} behind.` : "stopped syncing."}</strong> Its line is dotted and stops at its last sync.</Banner>
      ))}
      <div ref={ref}>
        <svg className="cor-trace" viewBox={`0 0 ${width} ${HEIGHT}`} role="img" aria-label={summary} tabIndex={0} onKeyDown={onKeyDown} onPointerMove={onPointerMove} onPointerLeave={() => setHover(null)} onClick={openBreakdown} style={drill ? { cursor: "pointer" } : undefined}>
          {geometry.ticks.map((tick) => (
            <g key={tick}>
              <line className="grid" x1={plot.left} x2={plot.right} y1={geometry.y(tick)} y2={geometry.y(tick)} />
              <text className="tick" x={plot.left - 8} y={geometry.y(tick) + 4} textAnchor="end">{formatMoney(tick, { currency, compact: true })}</text>
            </g>
          ))}
          {labelIndexes(count).map((i) => (
            <g key={i}>
              <line className="mark" x1={geometry.x(i)} x2={geometry.x(i)} y1={plot.bottom} y2={plot.bottom + 5} />
              <text className="tick" x={geometry.x(i)} y={plot.bottom + 20} textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}>{formatDay(trace.bucketStarts[i]).toUpperCase()}</text>
            </g>
          ))}
          {trace.annotations.map((note) => {
            const i = trace.bucketStarts.findIndex((start, k) => note.date >= start && note.date <= trace.bucketEnds[k]);
            if (i < 0) return null;
            const x = geometry.x(i);
            return (
              <g key={note.date + note.label}>
                <line x1={x} x2={x} y1={12} y2={plot.bottom} style={{ stroke: "var(--flare)" }} strokeWidth="1" strokeDasharray="2 3" />
                <path className="flag" d={`M${x} 4 h8 l-4 6 l4 6 h-8 z`} />
                <text className="flag-text" x={x + 12} y={13.5}>{note.label.toUpperCase()}</text>
              </g>
            );
          })}
          {primary >= 0 && !trace.series[primary].values.includes(null) && (
            <path d={`${geometry.paths[primary]}L${geometry.x(count - 1)},${plot.bottom}L${geometry.x(0)},${plot.bottom}Z`} style={{ fill: channelColor(trace.series[primary].colorIndex) }} fillOpacity={0.12} />
          )}
          {trace.series.map((series, i) => (
            <path key={series.platform} d={geometry.paths[i]} fill="none" style={{ stroke: channelColor(series.colorIndex) }} strokeWidth={i === primary ? 2.5 : 2} strokeLinecap="round" strokeDasharray={series.stale ? "1 4" : undefined} />
          ))}
          {trace.series.map((series, i) => {
            const end = endpoints[i];
            if (!end) return null;
            return (
              <g key={series.platform}>
                <circle cx={end.x} cy={end.y} r={i === primary ? 3.5 : 3} style={{ fill: channelColor(series.colorIndex) }} />
                <text className="lbl" x={plot.right + 10} y={labelYs[i] - 2} style={{ fill: channelColor(series.colorIndex) }}>{series.name}</text>
                <text className="val" x={plot.right + 10} y={labelYs[i] + 12}>{money(end.value)}</text>
              </g>
            );
          })}
          {hover !== null && (
            <g>
              <line className="cross" x1={geometry.x(hover)} x2={geometry.x(hover)} y1={plot.top} y2={plot.bottom} />
              {trace.series.map((series) => series.values[hover] !== null && (
                <circle key={series.platform} cx={geometry.x(hover)} cy={geometry.y(series.values[hover] as number)} r="3" strokeWidth="2" style={{ fill: "var(--bg)", stroke: channelColor(series.colorIndex) }} />
              ))}
              <rect className="tip" x={tipX} y={plot.bottom - 34} width={TIP_WIDTH} height="26" rx="4" />
              <text className="tip-text" x={tipX + 8} y={plot.bottom - 17}>{`${bucketLabel(hover)} · ${money(hoverTotal)}`}</text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}
