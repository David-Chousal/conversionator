import { dayCount, formatRange } from "./dates";
import { scopeTag } from "./share";
import type { AnalyticsReport } from "./types";

export interface BoardContext {
  rangeLabel: string;
  windowDays: number;
  /** Channel scope tag for readouts: "CH·ALL", "CH·01, 02", or one campaign's channel. */
  scope: string;
  /** Where the ledger's return side comes from. */
  revenueLabel: string;
}

/** Labels every bay on the board shares, derived once from the report. */
export function boardContext(report: AnalyticsReport): BoardContext {
  const { filter, today, attribution } = report;
  const campaign = report.campaignOptions.find((option) => option.id === filter.campaignId);
  const campaignChannel = campaign ? report.channels.find((channel) => channel.platform === campaign.platform)?.channelCode ?? null : null;
  return {
    rangeLabel: formatRange(filter.from, filter.to, today),
    windowDays: dayCount(filter.from, filter.to),
    scope: scopeTag(report.channels, campaignChannel),
    revenueLabel: attribution.source === "crm" ? `${attribution.crmName} closed-won revenue` : "platform-reported conversion value",
  };
}
