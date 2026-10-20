import { toCsv } from "@/lib/analytics/csv";
import type { ReportContent, ReportFormat } from "./types";
import { metricHeader, rawMetric } from "./format";

export { reportPdf } from "./pdf";

/** One row per campaign with raw numbers, then a total row: the shape spreadsheets want. */
export function reportCsv(content: ReportContent): string {
  const headers = ["Channel", "Campaign", ...content.metrics.map((metric) => metricHeader(metric.key, metric.label, content.currency))];
  const cells = (values: (number | null)[]) => content.metrics.map((metric, i) => rawMetric(metric.key, values[i]));
  const rows = content.campaigns.map((row) => [row.channel, row.name, ...cells(row.values)]);
  return toCsv(headers, [...rows, ["Total", "All campaigns", ...cells(content.total)]]);
}

export function reportFilename(content: ReportContent, format: ReportFormat): string {
  const slug = content.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
  return `${slug}-${content.from}-to-${content.to}.${format}`;
}
