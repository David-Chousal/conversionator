import { BAY_KINDS, type BayConfig } from "@/lib/analytics/layout";
import { metricLabel } from "@/lib/analytics/metrics";
import type { AttributionSource, MetricKey } from "@/lib/analytics/types";

/** Metrics that only exist when a CRM attributes leads. */
export const CRM_ONLY_METRICS: readonly MetricKey[] = ["leads", "cpl"];

/** How a bay is named in controls: "Spend by channel", "Deals won readout". */
export function bayName(bay: Pick<BayConfig, "kind" | "metric">, source: AttributionSource): string {
  return bay.kind === "readout" && bay.metric ? `${metricLabel(bay.metric, source)} readout` : BAY_KINDS[bay.kind].name;
}
