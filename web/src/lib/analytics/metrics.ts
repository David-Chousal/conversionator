import type { AttributionSource, MetricKey, Totals } from "./types";

export const EMPTY_TOTALS: Totals = { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0, leads: 0 };

export function addTotals(a: Totals, b: Totals): Totals {
  return {
    spend: a.spend + b.spend,
    impressions: a.impressions + b.impressions,
    clicks: a.clicks + b.clicks,
    conversions: a.conversions + b.conversions,
    revenue: a.revenue + b.revenue,
    leads: a.leads + b.leads,
  };
}

export function subtractTotals(a: Totals, b: Totals): Totals {
  return {
    spend: a.spend - b.spend,
    impressions: a.impressions - b.impressions,
    clicks: a.clicks - b.clicks,
    conversions: a.conversions - b.conversions,
    revenue: a.revenue - b.revenue,
    leads: a.leads - b.leads,
  };
}

/** A metric from summed totals; null when it can't be computed (nothing spent, no conversions). */
export function metricValue(key: MetricKey, totals: Totals): number | null {
  if (key === "spend") return totals.spend;
  if (key === "conversions") return totals.conversions;
  if (key === "leads") return totals.leads;
  if (key === "roas") return totals.spend > 0 ? totals.revenue / totals.spend : null;
  if (key === "cpl") return totals.leads > 0 ? totals.spend / totals.leads : null;
  return totals.conversions > 0 ? totals.spend / totals.conversions : null;
}

/** The four readouts on the board, by attribution source. */
export const READOUT_KEYS: Record<AttributionSource, readonly MetricKey[]> = {
  crm: ["spend", "leads", "cpl", "roas"],
  platform: ["spend", "conversions", "cpa", "roas"],
};

/** Which direction is good for each metric; spend has none. */
export const METRIC_DIRECTION: Record<MetricKey, "up" | "down" | "none"> = { spend: "none", roas: "up", cpa: "down", conversions: "up", leads: "up", cpl: "down" };

const METRIC_LABELS: Record<MetricKey, string> = { spend: "Ad spend", roas: "ROAS", cpa: "Cost per acquisition", conversions: "Conversions", leads: "Leads", cpl: "Cost per lead" };

/** A metric's name as the user sees it: with a CRM, conversions are deals won. */
export function metricLabel(key: MetricKey, source: AttributionSource): string {
  if (source === "crm" && key === "conversions") return "Deals won";
  if (key === "cpa") return source === "crm" ? "Cost per deal" : "CPA";
  return METRIC_LABELS[key];
}
