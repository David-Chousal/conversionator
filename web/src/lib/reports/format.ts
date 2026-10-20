import type { MetricKey } from "@/lib/analytics/types";
import { formatCount, formatMoney, formatRoas } from "@/lib/format";

/** A report cell as people read it; "—" when it can't be computed. */
export function formatMetric(key: MetricKey, value: number | null, currency: string): string {
  if (value === null) return "—";
  if (key === "spend") return formatMoney(value, { currency });
  if (key === "cpa" || key === "cpl") return formatMoney(value, { currency, cents: true });
  if (key === "roas") return formatRoas(value);
  return formatCount(value);
}

const MONEY: readonly MetricKey[] = ["spend", "cpa", "cpl"];

/** A raw value for spreadsheets: two decimals for money and ratios, whole numbers for counts. */
export function rawMetric(key: MetricKey, value: number | null): string {
  if (value === null) return "";
  return key === "conversions" || key === "leads" ? String(Math.round(value)) : value.toFixed(2);
}

export const metricHeader = (key: MetricKey, label: string, currency: string): string => (MONEY.includes(key) ? `${label} (${currency})` : label);
