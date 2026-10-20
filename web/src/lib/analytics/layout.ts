import { READOUT_KEYS } from "./metrics";
import type { AttributionSource, MetricKey } from "./types";

export type BayKind = "readout" | "trace" | "ledger" | "share" | "campaigns";
export type Span = 3 | 4 | 6 | 8 | 12;

export interface BayConfig {
  id: string;
  kind: BayKind;
  span: Span;
  /** Readouts only: which metric the tile shows. */
  metric?: MetricKey;
}

export interface SavedView {
  id: string;
  name: string;
  /** Null means "the system default for the current attribution source". */
  bays: BayConfig[] | null;
}

export interface BayKindInfo {
  kind: BayKind;
  name: string;
  description: string;
  spans: readonly Span[];
  defaultSpan: Span;
}

export const DEFAULT_VIEW_ID = "default";
export const MAX_BAYS = 24;
const METRICS: readonly MetricKey[] = ["spend", "roas", "cpa", "conversions", "leads", "cpl"];

export const BAY_KINDS: Record<BayKind, BayKindInfo> = {
  readout: { kind: "readout", name: "Readout", description: "One metric, slope, 90-day range", spans: [3, 4, 6], defaultSpan: 3 },
  trace: { kind: "trace", name: "Spend by channel", description: "Lines per channel over the window", spans: [6, 12], defaultSpan: 12 },
  ledger: { kind: "ledger", name: "Return ledger", description: "Spend against return per channel", spans: [6, 12], defaultSpan: 6 },
  share: { kind: "share", name: "Share of spend", description: "Up to four channels and the total", spans: [4, 6], defaultSpan: 6 },
  campaigns: { kind: "campaigns", name: "Campaigns", description: "Every campaign, sortable", spans: [12], defaultSpan: 12 },
};

/** Identity of a bay's content: two bays never show the same thing. */
export function bayKey(bay: Pick<BayConfig, "kind" | "metric">): string {
  return bay.kind === "readout" ? `readout:${bay.metric}` : bay.kind;
}

/** The layout every workspace starts with; readouts follow the attribution source. */
export function systemDefault(source: AttributionSource): BayConfig[] {
  const readouts = READOUT_KEYS[source].map((metric): BayConfig => ({ id: `readout-${metric}`, kind: "readout", span: 3, metric }));
  return [
    ...readouts,
    { id: "trace", kind: "trace", span: 12 },
    { id: "ledger", kind: "ledger", span: 6 },
    { id: "share", kind: "share", span: 6 },
    { id: "campaigns", kind: "campaigns", span: 12 },
  ];
}

export function resolveBays(view: SavedView, source: AttributionSource): BayConfig[] {
  return view.bays ?? systemDefault(source);
}

export function moveBay(bays: BayConfig[], from: number, to: number): BayConfig[] {
  const target = Math.max(0, Math.min(bays.length - 1, to));
  if (from === target || from < 0 || from >= bays.length) return bays;
  const next = [...bays];
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}

/** The allowed width closest to `raw` (ties go wider). */
export function snapSpan(kind: BayKind, raw: number): Span {
  return BAY_KINDS[kind].spans.reduce((best, span) => (Math.abs(span - raw) <= Math.abs(best - raw) ? span : best));
}

export function resizeBay(bays: BayConfig[], id: string, raw: number): BayConfig[] {
  return bays.map((bay) => (bay.id === id ? { ...bay, span: snapSpan(bay.kind, raw) } : bay));
}

/** The next allowed width up (+1) or down (−1), staying put at the ends. */
export function stepSpan(kind: BayKind, span: Span, direction: 1 | -1): Span {
  const spans = BAY_KINDS[kind].spans;
  const index = spans.indexOf(span);
  return spans[Math.max(0, Math.min(spans.length - 1, index + direction))];
}

export function addBay(bays: BayConfig[], kind: BayKind, metric?: MetricKey): BayConfig[] {
  const base = kind === "readout" ? `readout-${metric}` : kind;
  const taken = new Set(bays.map((bay) => bay.id));
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  const bay: BayConfig = { id, kind, span: BAY_KINDS[kind].defaultSpan, ...(kind === "readout" ? { metric } : {}) };
  return [bay, ...bays];
}

export function removeBay(bays: BayConfig[], id: string): BayConfig[] {
  return bays.filter((bay) => bay.id !== id);
}

export function isOnBoard(bays: BayConfig[], kind: BayKind, metric?: MetricKey): boolean {
  const key = bayKey({ kind, metric });
  return bays.some((bay) => bayKey(bay) === key);
}

function validateBay(value: unknown): BayConfig {
  if (typeof value !== "object" || value === null) throw new Error("Each bay must be an object.");
  const { id, kind, span, metric } = value as Record<string, unknown>;
  if (typeof id !== "string" || id.length === 0 || id.length > 64) throw new Error("Each bay needs an id.");
  if (typeof kind !== "string" || !(kind in BAY_KINDS)) throw new Error(`Unknown bay kind: ${String(kind)}.`);
  const info = BAY_KINDS[kind as BayKind];
  if (!info.spans.includes(span as Span)) throw new Error(`${info.name} can't take a width of ${String(span)}.`);
  if (kind === "readout" && !METRICS.includes(metric as MetricKey)) throw new Error(`Unknown readout metric: ${String(metric)}.`);
  return { id, kind: kind as BayKind, span: span as Span, ...(kind === "readout" ? { metric: metric as MetricKey } : {}) };
}

/** Checks a layout from outside (a request body or storage) and returns it typed. */
export function validateLayout(value: unknown): BayConfig[] {
  if (!Array.isArray(value)) throw new Error("A layout must be a list of bays.");
  if (value.length > MAX_BAYS) throw new Error(`A view holds at most ${MAX_BAYS} bays.`);
  const bays = value.map(validateBay);
  const keys = new Set<string>();
  for (const bay of bays) {
    if (keys.has(bayKey(bay))) throw new Error(`${BAY_KINDS[bay.kind].name} appears twice.`);
    keys.add(bayKey(bay));
  }
  return bays;
}
