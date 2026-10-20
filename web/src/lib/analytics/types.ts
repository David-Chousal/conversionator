import type { Signal } from "@/lib/data/sync";
import type { CrmStatus, LeadStage, Platform } from "@/lib/data/types";
import type { IsoDate } from "./dates";

export type MetricKey = "spend" | "roas" | "cpa" | "conversions" | "leads" | "cpl";

/**
 * Where conversions, revenue and leads come from: the CRM's attribution (HubSpot, last ad interaction)
 * or each ad platform's own pixel ("platform-reported", which can double count across platforms).
 */
export type AttributionSource = "crm" | "platform";

/** Totals after resolving the attribution source. Leads exist only with a CRM. */
export interface Totals {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  leads: number;
}

/** One ad on one day, with both platform-reported and CRM-attributed outcomes. */
export interface RawDailyRow {
  date: IsoDate;
  platform: Platform;
  campaignId: string;
  adId: string;
  spend: number;
  impressions: number;
  clicks: number;
  platformConversions: number;
  platformRevenue: number;
  crmLeads: number;
  crmDeals: number;
  crmRevenue: number;
}

/** CRM outcomes on a day that came from no ad (organic, email, direct). */
export interface UnattributedDay {
  date: IsoDate;
  leads: number;
  deals: number;
  revenue: number;
}

export interface DailyRow extends Totals {
  date: IsoDate;
  platform: Platform;
  campaignId: string;
  adId: string;
}

export interface CampaignInfo {
  id: string;
  name: string;
  platform: Platform;
  /** Null when the campaign predates the available history. */
  startDate: IsoDate | null;
}

export interface AdInfo {
  id: string;
  name: string;
  campaignId: string;
  platform: Platform;
}

export interface AdTotals extends Totals {
  platform: Platform;
  campaignId: string;
}

/** Totals per ad id, for drilling into any window without another request. */
export type AdTotalsMap = Record<string, AdTotals>;

export interface ChannelInput {
  platform: Platform;
  name: string;
  channelCode: string;
  signal: Signal;
  /** Last day with data; null while the first sync runs. */
  dataThrough: IsoDate | null;
}

export interface AttributionContext {
  source: AttributionSource;
  crmName: string | null;
  leadStage: LeadStage | null;
  crmStatus: CrmStatus;
}

export interface OutcomeTotals {
  leads: number;
  deals: number;
  revenue: number;
}

export interface Attribution extends AttributionContext {
  /** CRM outcomes credited to an ad in the window (zero without a CRM). */
  attributed: OutcomeTotals;
  /** CRM outcomes in the window that came from no ad. */
  unattributed: OutcomeTotals;
}

export interface AnalyticsFilter {
  from: IsoDate;
  to: IsoDate;
  excluded: Platform[];
  campaignId: string | null;
  /** The person's default window in days, when it isn't 30; links leave the window out only when it matches. */
  defaultDays?: number;
}

export interface ReadoutData {
  key: MetricKey;
  value: number | null;
  previous: number | null;
  range: { min: number; max: number } | null;
  source: AttributionSource;
  /** "HubSpot", "Platform-reported", or null for metrics that don't depend on attribution (spend). */
  sourceLabel: string | null;
}

export interface ChannelSummary extends ChannelInput {
  /** 1–6 for ch-1…ch-6, null for "Other". */
  colorIndex: number | null;
  included: boolean;
  /** Spend in the window, whether or not the channel is muted. */
  spend: number;
  /** Share of spend in the window across all channels, 0–1. */
  share: number;
}

export interface TraceSeries {
  platform: Platform;
  name: string;
  colorIndex: number | null;
  values: (number | null)[];
  stale: boolean;
  staleAge?: string;
}

export interface Trace {
  granularity: "day" | "week";
  bucketStarts: IsoDate[];
  bucketEnds: IsoDate[];
  series: TraceSeries[];
  annotations: { date: IsoDate; label: string }[];
  /** Per-ad totals for each bucket, aligned with bucketStarts. */
  adsByBucket: AdTotalsMap[];
}

export interface LedgerRow {
  platform: Platform;
  name: string;
  colorIndex: number | null;
  spend: number;
  revenue: number;
}

export interface CampaignRow extends Totals {
  id: string;
  name: string;
  platform: Platform;
  channelCode: string;
  colorIndex: number | null;
}

export interface AnalyticsReport {
  filter: AnalyticsFilter;
  today: IsoDate;
  currency: string;
  previous: { from: IsoDate; to: IsoDate };
  attribution: Attribution;
  channels: ChannelSummary[];
  /** The four readouts for the attribution source, in order. */
  readouts: ReadoutData[];
  /** A readout for every metric, for custom layouts. */
  readoutsByKey: Record<MetricKey, ReadoutData>;
  trace: Trace;
  ledger: LedgerRow[];
  campaigns: CampaignRow[];
  campaignTotals: Totals;
  campaignOptions: { id: string; name: string; platform: Platform }[];
  ads: AdInfo[];
  /** Per-ad totals in the window and the previous window, for the drill-down. */
  adTotals: AdTotalsMap;
  previousAdTotals: AdTotalsMap;
  /** Daily spend across all channels for the scrubber, oldest first. */
  dailySpend: { date: IsoDate; spend: number }[];
  hasData: boolean;
}
