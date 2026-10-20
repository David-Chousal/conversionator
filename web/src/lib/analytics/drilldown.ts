import type { Platform } from "@/lib/data/types";
import { formatCount, formatMoney, formatRoas } from "@/lib/format";
import { dayCount, formatDay, formatRange } from "./dates";
import { EMPTY_TOTALS, addTotals, metricLabel, metricValue } from "./metrics";
import type { AdTotalsMap, AnalyticsReport, AttributionSource, MetricKey, ReadoutData, Totals } from "./types";

export interface DrillTarget {
  metric: MetricKey;
  /** Null for all channels; a platform lists its campaigns. */
  platform: Platform | null;
  /** Null for a channel's campaigns; a campaign lists its ads. */
  campaignId: string | null;
  /** Null for the whole window; a chart bucket index narrows to that bucket. */
  bucket: number | null;
}

export type DrillLevel = "channels" | "campaigns" | "ads";
export type DrillColumnKey = "spend" | "revenue" | "conversions" | "leads" | "share" | "roas" | "cpa" | "cpl";
type Scope = Pick<DrillTarget, "platform" | "campaignId">;

export interface DrillRow {
  id: string;
  name: string;
  sub: string;
  platform: Platform;
  colorIndex: number | null;
  totals: Totals;
  drillable: boolean;
}

export interface DrillView {
  target: DrillTarget;
  crumbs: { label: string; target: Scope | "current" }[];
  scopeLabel: string;
  windowDays: number;
  readout: ReadoutData;
  level: DrillLevel;
  columns: { key: DrillColumnKey; label: string }[];
  rows: DrillRow[];
  totals: Totals;
}

const COLUMNS: Record<MetricKey, DrillColumnKey[]> = {
  spend: ["spend", "share"],
  conversions: ["conversions", "share"],
  leads: ["leads", "share"],
  roas: ["spend", "revenue", "roas"],
  cpa: ["spend", "conversions", "cpa"],
  cpl: ["spend", "leads", "cpl"],
};

function columnLabel(key: DrillColumnKey, source: AttributionSource): string {
  const labels: Record<DrillColumnKey, string> = {
    spend: "Spend", revenue: "Revenue", leads: "Leads", share: "Share", roas: "ROAS", cpl: "CPL",
    conversions: source === "crm" ? "Deals" : "Conv.",
    cpa: source === "crm" ? "Cost/deal" : "CPA",
  };
  return labels[key];
}

const totalsOf = ({ spend, impressions, clicks, conversions, revenue, leads }: Totals): Totals => ({ spend, impressions, clicks, conversions, revenue, leads });

function sumMap(map: AdTotalsMap, scope: Scope, group?: (entry: AdTotalsMap[string], id: string) => string): Map<string, Totals> {
  const sums = new Map<string, Totals>();
  for (const [id, entry] of Object.entries(map)) {
    if (scope.platform && entry.platform !== scope.platform) continue;
    if (scope.campaignId && entry.campaignId !== scope.campaignId) continue;
    const key = group ? group(entry, id) : "all";
    sums.set(key, addTotals(sums.get(key) ?? EMPTY_TOTALS, totalsOf(entry)));
  }
  return sums;
}

const total = (map: AdTotalsMap, scope: Scope) => sumMap(map, scope).get("all") ?? EMPTY_TOTALS;

function scopeData(report: AnalyticsReport, bucket: number | null) {
  const { trace, filter } = report;
  if (bucket === null) return { current: report.adTotals, previous: report.previousAdTotals, from: filter.from, to: filter.to, prefix: "" };
  return {
    current: trace.adsByBucket[bucket] ?? {},
    previous: bucket > 0 ? trace.adsByBucket[bucket - 1] : null,
    from: trace.bucketStarts[bucket],
    to: trace.bucketEnds[bucket],
    prefix: trace.granularity === "week" ? `Wk of ${formatDay(trace.bucketStarts[bucket])} · ` : "",
  };
}

/** Best first: high ROAS, spend, leads and conversions; low CPA and CPL. Rows without a value go last. */
function sortRows(rows: DrillRow[], metric: MetricKey): DrillRow[] {
  const sign = metric === "cpa" || metric === "cpl" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = metricValue(metric, a.totals);
    const vb = metricValue(metric, b.totals);
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va - vb) * sign;
  });
}

function rowsFor(report: AnalyticsReport, current: AdTotalsMap, scope: Scope): DrillRow[] {
  const channel = (platform: Platform) => report.channels.find((entry) => entry.platform === platform);
  if (!scope.platform) {
    const sums = sumMap(current, scope, (entry) => entry.platform);
    return report.channels.filter((entry) => entry.included).map((entry) => ({
      id: entry.platform, name: entry.name, sub: entry.channelCode, platform: entry.platform, colorIndex: entry.colorIndex, totals: sums.get(entry.platform) ?? EMPTY_TOTALS, drillable: true,
    }));
  }
  const info = channel(scope.platform);
  const base = { platform: scope.platform, sub: info?.channelCode ?? "", colorIndex: info?.colorIndex ?? null };
  if (!scope.campaignId) {
    const sums = sumMap(current, scope, (entry) => entry.campaignId);
    return [...sums].map(([id, totals]) => ({ ...base, id, totals, drillable: true, name: report.campaignOptions.find((option) => option.id === id)?.name ?? id }));
  }
  const sums = sumMap(current, scope, (_, id) => id);
  return [...sums].map(([id, totals]) => ({ ...base, id, totals, drillable: false, name: report.ads.find((entry) => entry.id === id)?.name ?? id }));
}

function crumbsFor(report: AnalyticsReport, target: DrillTarget, source: AttributionSource): DrillView["crumbs"] {
  const all: Scope = { platform: null, campaignId: null };
  const label = metricLabel(target.metric, source);
  if (!target.platform) return [{ label, target: "current" }, { label: "All channels", target: "current" }];
  const channelName = report.channels.find((entry) => entry.platform === target.platform)?.name ?? target.platform;
  const head = [{ label, target: all }, { label: "All channels", target: all }];
  if (!target.campaignId) return [...head, { label: channelName, target: "current" }];
  const campaignName = report.campaignOptions.find((option) => option.id === target.campaignId)?.name ?? target.campaignId;
  return [...head, { label: channelName, target: { platform: target.platform, campaignId: null } }, { label: campaignName, target: "current" }];
}

function scopeName(report: AnalyticsReport, target: DrillTarget): string {
  const channel = target.platform ? report.channels.find((entry) => entry.platform === target.platform) : null;
  if (!channel) return "All channels";
  const campaign = target.campaignId ? report.campaignOptions.find((option) => option.id === target.campaignId) : null;
  return campaign ? `${channel.channelCode} ${campaign.name}` : `${channel.channelCode} ${channel.name}`;
}

/** Everything the drill-down drawer shows for one target. Totals always equal the scoped readout. */
export function buildDrill(report: AnalyticsReport, target: DrillTarget): DrillView {
  const { metric, bucket } = target;
  const source = report.attribution.source;
  const scope: Scope = { platform: target.platform, campaignId: target.platform ? target.campaignId : null };
  const data = scopeData(report, bucket);
  const totals = total(data.current, scope);
  const previousTotals = data.previous ? total(data.previous, scope) : null;
  const hasPrevious = previousTotals !== null && (previousTotals.spend > 0 || previousTotals.conversions > 0 || previousTotals.leads > 0);
  const boardReadout = report.readouts.find((readout) => readout.key !== "spend");
  const sourceLabel = metric === "spend" ? null : boardReadout?.sourceLabel ?? null;

  return {
    target,
    crumbs: crumbsFor(report, target, source),
    scopeLabel: `${scopeName(report, target)} · ${data.prefix}${formatRange(data.from, data.to, report.today)}`,
    windowDays: dayCount(data.from, data.to),
    readout: { key: metric, value: metricValue(metric, totals), previous: hasPrevious ? metricValue(metric, previousTotals) : null, range: null, source, sourceLabel },
    level: !scope.platform ? "channels" : !scope.campaignId ? "campaigns" : "ads",
    columns: COLUMNS[metric].map((key) => ({ key, label: columnLabel(key, source) })),
    rows: sortRows(rowsFor(report, data.current, scope).filter((row) => row.totals.spend > 0 || row.totals.conversions > 0 || row.totals.leads > 0), metric),
    totals,
  };
}

/** Share of the scope total: of the metric's own count for Leads and Conversions, of spend otherwise. */
function shareOf(totals: Totals, grand: Totals, metric: MetricKey): number {
  const field = metric === "conversions" ? "conversions" : metric === "leads" ? "leads" : "spend";
  return grand[field] > 0 ? totals[field] / grand[field] : 0;
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

/** One formatted cell of the drill-down table. */
export function drillCell(column: DrillColumnKey, totals: Totals, grand: Totals, currency: string, metric: MetricKey = "spend"): string {
  const money = (value: number | null, cents = false) => (value === null ? "—" : formatMoney(value, { currency, cents }));
  if (column === "spend") return money(totals.spend);
  if (column === "revenue") return money(totals.revenue);
  if (column === "conversions") return formatCount(totals.conversions);
  if (column === "leads") return formatCount(totals.leads);
  if (column === "cpa") return money(ratio(totals.spend, totals.conversions), true);
  if (column === "cpl") return money(ratio(totals.spend, totals.leads), true);
  if (column === "roas") {
    const roas = ratio(totals.revenue, totals.spend);
    return roas === null ? "—" : formatRoas(roas);
  }
  return `${(shareOf(totals, grand, metric) * 100).toFixed(1)}%`;
}

/** Raw (unformatted) value for CSV export, so spreadsheets get numbers. */
function rawCell(column: DrillColumnKey, totals: Totals, grand: Totals, metric: MetricKey): string {
  const fixed = (value: number | null, digits: number) => (value === null ? "" : value.toFixed(digits));
  if (column === "spend") return totals.spend.toFixed(2);
  if (column === "revenue") return totals.revenue.toFixed(2);
  if (column === "conversions") return String(totals.conversions);
  if (column === "leads") return String(totals.leads);
  if (column === "roas") return fixed(ratio(totals.revenue, totals.spend), 4);
  if (column === "cpa") return fixed(ratio(totals.spend, totals.conversions), 2);
  if (column === "cpl") return fixed(ratio(totals.spend, totals.leads), 2);
  return shareOf(totals, grand, metric).toFixed(4);
}

const LEVEL_NOUN: Record<DrillLevel, string> = { channels: "Channel", campaigns: "Campaign", ads: "Ad" };

/** Header and rows for exporting exactly what the drawer shows. */
export function drillExport(view: DrillView): { headers: string[]; rows: string[][] } {
  return {
    headers: [LEVEL_NOUN[view.level], "Channel code", ...view.columns.map((column) => column.label)],
    rows: view.rows.map((row) => [row.name, row.sub, ...view.columns.map((column) => rawCell(column.key, row.totals, view.totals, view.target.metric))]),
  };
}
