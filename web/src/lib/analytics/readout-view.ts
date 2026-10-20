import { formatChange, formatCount, formatMoney, formatRoas, type ChangeKind } from "@/lib/format";
import { METRIC_DIRECTION, metricLabel } from "./metrics";
import type { MetricKey, ReadoutData } from "./types";

export interface ReadoutView {
  key: MetricKey;
  label: string;
  sourceLabel: string | null;
  /** Meaningful digits, shown full size. */
  main: string;
  /** Units or cents, shown at 60% in ink-muted. */
  small: string;
  change: string | null;
  tone: "good" | "bad" | "flat";
  slopeDegrees: number;
  rangeMin: string | null;
  rangeMax: string | null;
  nowPercent: number | null;
  previousPercent: number | null;
}

const CHANGE_KIND: Record<MetricKey, ChangeKind> = { spend: "percent", roas: "roas", cpa: "money", conversions: "percent", leads: "percent", cpl: "money" };
const MAX_SLOPE = 45;
const SLOPE_PER_UNIT_CHANGE = 150;

function split(key: MetricKey, value: number | null, currency: string): { main: string; small: string } {
  if (value === null) return { main: "—", small: "" };
  if (key === "spend") return { main: formatMoney(value, { currency }), small: "" };
  if (key === "conversions" || key === "leads") return { main: formatCount(value), small: "" };
  if (key === "roas") return { main: value.toFixed(1), small: "×" };
  const [whole, cents] = formatMoney(value, { currency, cents: true }).split(".");
  return { main: whole, small: `.${cents}` };
}

function formatEnd(key: MetricKey, value: number, currency: string): string {
  if (key === "spend") return formatMoney(value, { currency, compact: true });
  if (key === "cpa" || key === "cpl") return formatMoney(value, { currency, cents: true });
  if (key === "roas") return formatRoas(value);
  return formatCount(value);
}

function change(key: MetricKey, value: number, previous: number, currency: string): string | null {
  if (CHANGE_KIND[key] === "percent") return previous === 0 ? null : formatChange(value / previous - 1, "percent", currency);
  return formatChange(value - previous, CHANGE_KIND[key], currency);
}

function tone(key: MetricKey, delta: number): ReadoutView["tone"] {
  const direction = METRIC_DIRECTION[key];
  if (direction === "none" || delta === 0) return "flat";
  return (delta > 0) === (direction === "up") ? "good" : "bad";
}

const position = (value: number | null, range: ReadoutData["range"]) => {
  if (value === null || !range) return null;
  if (range.max === range.min) return 50;
  return ((value - range.min) / (range.max - range.min)) * 100;
};

/** Display strings and positions for one readout. */
export function readoutView(readout: ReadoutData, currency: string): ReadoutView {
  const { key, value, previous, range } = readout;
  const comparable = value !== null && previous !== null;
  const relative = comparable && previous !== 0 ? (value - previous) / Math.abs(previous) : 0;
  return {
    key,
    label: metricLabel(key, readout.source),
    sourceLabel: readout.sourceLabel,
    ...split(key, value, currency),
    change: comparable ? change(key, value, previous, currency) : null,
    tone: comparable ? tone(key, value - previous) : "flat",
    slopeDegrees: Math.max(-MAX_SLOPE, Math.min(MAX_SLOPE, Math.round(relative * SLOPE_PER_UNIT_CHANGE))),
    rangeMin: range ? formatEnd(key, range.min, currency) : null,
    rangeMax: range ? formatEnd(key, range.max, currency) : null,
    nowPercent: position(value, range),
    previousPercent: position(previous, range),
  };
}
