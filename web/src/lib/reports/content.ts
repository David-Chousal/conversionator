import { formatDay, formatRange, type IsoDate } from "@/lib/analytics/dates";
import { EMPTY_TOTALS, addTotals, metricLabel, metricValue } from "@/lib/analytics/metrics";
import { readoutView } from "@/lib/analytics/readout-view";
import type { AnalyticsReport, MetricKey, Totals } from "@/lib/analytics/types";
import type { Platform } from "@/lib/data/types";
import type { ReportContent, ReportInput } from "./types";

const CRM_ONLY: readonly MetricKey[] = ["leads", "cpl"];

function sourceLabel(report: AnalyticsReport): string {
  if (report.attribution.source === "platform") return "Platform-reported conversions and revenue";
  return `Leads and revenue attributed by ${report.attribution.crmName ?? "your CRM"} · last ad interaction`;
}

function totalsByPlatform(report: AnalyticsReport): Map<Platform, Totals> {
  const totals = new Map<Platform, Totals>();
  for (const row of report.campaigns) totals.set(row.platform, addTotals(totals.get(row.platform) ?? EMPTY_TOTALS, row));
  return totals;
}

/** The report for one definition, from the analytics report for its window and channels. */
export function buildReportContent(input: ReportInput, report: AnalyticsReport, today: IsoDate): ReportContent {
  const source = report.attribution.source;
  const keys = input.metrics.filter((key) => source === "crm" || !CRM_ONLY.includes(key));
  const values = (totals: Totals) => keys.map((key) => metricValue(key, totals));
  const channels = report.channels.filter((channel) => channel.included);
  const byPlatform = totalsByPlatform(report);
  const nameOf = new Map(report.channels.map((channel) => [channel.platform, channel.name]));

  return {
    title: input.name.trim() || "Untitled report",
    from: report.filter.from,
    to: report.filter.to,
    windowLabel: formatRange(report.filter.from, report.filter.to, today),
    previousLabel: input.compare ? `Compared with ${formatRange(report.previous.from, report.previous.to, today)}` : null,
    sourceLabel: sourceLabel(report),
    channelNames: channels.map((channel) => channel.name),
    currency: report.currency,
    generatedOn: formatDay(today, true),
    metrics: keys.map((key) => ({ key, label: metricLabel(key, source) })),
    summary: keys.map((key) => {
      const view = readoutView(report.readoutsByKey[key], report.currency);
      return { key, label: view.label, value: `${view.main}${view.small}`, change: input.compare ? view.change : null, tone: input.compare ? view.tone : "flat" };
    }),
    byChannel: channels.map((channel) => ({ name: channel.name, code: channel.channelCode, values: values(byPlatform.get(channel.platform) ?? EMPTY_TOTALS) })),
    total: values(report.campaignTotals),
    campaigns: [...report.campaigns]
      .sort((a, b) => b.spend - a.spend)
      .map((row) => ({ name: row.name, channel: nameOf.get(row.platform) ?? row.platform, values: values(row) })),
    empty: !report.hasData,
  };
}
