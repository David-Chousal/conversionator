import type { Platform } from "@/lib/data/types";
import { addDays, dayCount, type IsoDate } from "./dates";
import { EMPTY_TOTALS, READOUT_KEYS, addTotals, metricValue, subtractTotals } from "./metrics";
import type {
  AdInfo, AdTotalsMap, AnalyticsFilter, AnalyticsReport, Attribution, AttributionContext, CampaignInfo, CampaignRow, ChannelInput,
  ChannelSummary, DailyRow, LedgerRow, MetricKey, OutcomeTotals, RawDailyRow, ReadoutData, Totals, Trace, UnattributedDay,
} from "./types";

export interface ReportInput {
  rows: RawDailyRow[];
  campaigns: CampaignInfo[];
  ads: AdInfo[];
  unattributed: UnattributedDay[];
  channels: ChannelInput[];
  filter: AnalyticsFilter;
  today: IsoDate;
  currency: string;
  attribution: AttributionContext;
}

const PLATFORM_REPORTED = "Platform-reported";
const NO_OUTCOMES: OutcomeTotals = { leads: 0, deals: 0, revenue: 0 };

const RANGE_DAYS = 90;
const SCRUBBER_DAYS = 180;
const DAILY_GRANULARITY_MAX_DAYS = 14;
const MAX_ANNOTATIONS = 3;

export function colorIndexFor(channelCode: string): number | null {
  const n = Number(channelCode.replace(/\D/g, ""));
  return n >= 1 && n <= 6 ? n : null;
}

function sumRows(rows: DailyRow[]): Totals {
  return rows.reduce<Totals>((sum, row) => addTotals(sum, row), EMPTY_TOTALS);
}

const within = (from: IsoDate, to: IsoDate) => (row: DailyRow) => row.date >= from && row.date <= to;

/** Picks the outcome numbers for the attribution source: HubSpot's attribution, or each platform's own pixel. */
/** Raw rows with outcomes taken from the CRM or the platforms, per the attribution source. */
export function resolveRows(rows: RawDailyRow[], source: Attribution["source"]): DailyRow[] {
  const crm = source === "crm";
  return rows.map((row) => ({
    date: row.date, platform: row.platform, campaignId: row.campaignId, adId: row.adId,
    spend: row.spend, impressions: row.impressions, clicks: row.clicks,
    conversions: crm ? row.crmDeals : row.platformConversions,
    revenue: crm ? row.crmRevenue : row.platformRevenue,
    leads: crm ? row.crmLeads : 0,
  }));
}

const totalsOf = ({ spend, impressions, clicks, conversions, revenue, leads }: Totals): Totals => ({ spend, impressions, clicks, conversions, revenue, leads });

/** Totals per ad, keyed by ad id. */
function totalsByAd(rows: DailyRow[]): AdTotalsMap {
  const ads: AdTotalsMap = {};
  for (const row of rows) {
    const current = ads[row.adId];
    ads[row.adId] = { ...addTotals(current ? totalsOf(current) : EMPTY_TOTALS, row), platform: row.platform, campaignId: row.campaignId };
  }
  return ads;
}

/** Totals per day, keyed by date. */
function totalsByDay(rows: DailyRow[]): Map<IsoDate, Totals> {
  const days = new Map<IsoDate, Totals>();
  for (const row of rows) days.set(row.date, addTotals(days.get(row.date) ?? EMPTY_TOTALS, row));
  return days;
}

/** Totals of every window of `length` days ending on each of the last 90 days, skipping windows before history starts. */
function trailingWindows(rows: DailyRow[], length: number, today: IsoDate): Totals[] {
  if (rows.length === 0) return [];
  const earliest = rows.reduce((min, row) => (row.date < min ? row.date : min), rows[0].date);
  const days = totalsByDay(rows);
  const start = addDays(today, -(RANGE_DAYS - 1) - length);
  const prefix: Totals[] = [EMPTY_TOTALS];
  for (let date = start; date <= today; date = addDays(date, 1)) prefix.push(addTotals(prefix[prefix.length - 1], days.get(date) ?? EMPTY_TOTALS));

  const windows: Totals[] = [];
  for (let offset = RANGE_DAYS - 1; offset >= 0; offset -= 1) {
    const end = addDays(today, -offset);
    if (addDays(end, -(length - 1)) < earliest) continue;
    const endIndex = dayCount(start, end);
    windows.push(subtractTotals(prefix[endIndex], prefix[endIndex - length]));
  }
  return windows;
}

const ALL_METRICS: readonly MetricKey[] = ["spend", "roas", "cpa", "conversions", "leads", "cpl"];

function readouts(scoped: DailyRow[], input: ReportInput, previous: { from: IsoDate; to: IsoDate }): Record<MetricKey, ReadoutData> {
  const { filter, today, attribution } = input;
  const current = sumRows(scoped.filter(within(filter.from, filter.to)));
  const before = sumRows(scoped.filter(within(previous.from, previous.to)));
  const hasPrevious = before.spend > 0 || before.conversions > 0 || before.leads > 0;
  const windows = trailingWindows(scoped, dayCount(filter.from, filter.to), today);
  const outcomeLabel = attribution.source === "crm" ? attribution.crmName : PLATFORM_REPORTED;
  const entries = ALL_METRICS.map((key): [MetricKey, ReadoutData] => {
    const values = windows.map((totals) => metricValue(key, totals)).filter((value): value is number => value !== null);
    return [key, {
      key,
      value: metricValue(key, current),
      previous: hasPrevious ? metricValue(key, before) : null,
      range: values.length > 0 ? { min: Math.min(...values), max: Math.max(...values) } : null,
      source: attribution.source,
      sourceLabel: key === "spend" ? null : outcomeLabel,
    }];
  });
  return Object.fromEntries(entries) as Record<MetricKey, ReadoutData>;
}

function attributionFor(input: ReportInput, windowRows: DailyRow[]): Attribution {
  const { attribution, unattributed, filter } = input;
  if (attribution.source !== "crm") return { ...attribution, attributed: NO_OUTCOMES, unattributed: NO_OUTCOMES };
  const credited = sumRows(windowRows);
  const missed = unattributed
    .filter((day) => day.date >= filter.from && day.date <= filter.to)
    .reduce<OutcomeTotals>((sum, day) => ({ leads: sum.leads + day.leads, deals: sum.deals + day.deals, revenue: sum.revenue + day.revenue }), NO_OUTCOMES);
  return { ...attribution, attributed: { leads: credited.leads, deals: credited.conversions, revenue: credited.revenue }, unattributed: missed };
}

function bucketsFor(from: IsoDate, to: IsoDate): Pick<Trace, "granularity" | "bucketStarts" | "bucketEnds"> {
  const days = dayCount(from, to);
  if (days <= DAILY_GRANULARITY_MAX_DAYS) {
    const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
    return { granularity: "day", bucketStarts: dates, bucketEnds: dates };
  }
  const weeks = Math.floor(days / 7);
  const bucketEnds = Array.from({ length: weeks }, (_, i) => addDays(to, -7 * (weeks - 1 - i)));
  return { granularity: "week", bucketStarts: bucketEnds.map((end) => addDays(end, -6)), bucketEnds };
}

function trace(scoped: DailyRow[], channels: ChannelSummary[], campaigns: CampaignInfo[], filter: AnalyticsFilter): Trace {
  const buckets = bucketsFor(filter.from, filter.to);
  const platforms = new Set(scoped.map((row) => row.platform));
  const series = channels.filter((channel) => channel.included && platforms.has(channel.platform)).map((channel) => ({
    platform: channel.platform,
    name: channel.name,
    colorIndex: channel.colorIndex,
    stale: channel.signal.state !== "ok",
    staleAge: channel.signal.state !== "ok" ? channel.signal.age : undefined,
    values: buckets.bucketStarts.map((start, i) => {
      if (!channel.dataThrough || start > channel.dataThrough) return null;
      return sumRows(scoped.filter((row) => row.platform === channel.platform && row.date >= start && row.date <= buckets.bucketEnds[i])).spend;
    }),
  }));
  const annotations = campaigns
    .filter((campaign) => campaign.startDate && platforms.has(campaign.platform) && (!filter.campaignId || campaign.id === filter.campaignId))
    .filter((campaign) => campaign.startDate! >= filter.from && campaign.startDate! <= filter.to)
    .sort((a, b) => a.startDate!.localeCompare(b.startDate!))
    .slice(0, MAX_ANNOTATIONS)
    .map((campaign) => ({ date: campaign.startDate!, label: campaign.name }));
  const adsByBucket = buckets.bucketStarts.map((start, i) => totalsByAd(scoped.filter(within(start, buckets.bucketEnds[i]))));
  return { ...buckets, series, annotations, adsByBucket };
}

function channelSummaries(input: ReportInput, rows: DailyRow[]): ChannelSummary[] {
  const { channels, filter } = input;
  const windowRows = rows.filter(within(filter.from, filter.to));
  const total = sumRows(windowRows).spend;
  return [...channels]
    .sort((a, b) => a.channelCode.localeCompare(b.channelCode))
    .map((channel) => {
      const spend = sumRows(windowRows.filter((row) => row.platform === channel.platform)).spend;
      return { ...channel, colorIndex: colorIndexFor(channel.channelCode), included: !filter.excluded.includes(channel.platform), spend, share: total > 0 ? spend / total : 0 };
    });
}

function ledger(windowRows: DailyRow[], channels: ChannelSummary[]): LedgerRow[] {
  return channels
    .filter((channel) => channel.included)
    .map((channel) => {
      const totals = sumRows(windowRows.filter((row) => row.platform === channel.platform));
      return { platform: channel.platform, name: channel.name, colorIndex: channel.colorIndex, spend: totals.spend, revenue: totals.revenue };
    })
    .filter((row) => row.spend > 0)
    .sort((a, b) => b.spend - a.spend);
}

function campaignRows(windowRows: DailyRow[], campaigns: CampaignInfo[], channels: ChannelSummary[]): CampaignRow[] {
  const byPlatform = new Map<Platform, ChannelSummary>(channels.map((channel) => [channel.platform, channel]));
  return campaigns
    .map((campaign) => {
      const channel = byPlatform.get(campaign.platform);
      const totals = sumRows(windowRows.filter((row) => row.campaignId === campaign.id));
      return { ...totals, id: campaign.id, name: campaign.name, platform: campaign.platform, channelCode: channel?.channelCode ?? "", colorIndex: channel?.colorIndex ?? null };
    })
    .filter((row) => row.spend > 0 || row.conversions > 0 || row.leads > 0)
    .sort((a, b) => b.spend - a.spend);
}

function dailySpend(rows: DailyRow[], today: IsoDate): { date: IsoDate; spend: number }[] {
  const days = totalsByDay(rows);
  return Array.from({ length: SCRUBBER_DAYS }, (_, i) => {
    const date = addDays(today, i - (SCRUBBER_DAYS - 1));
    return { date, spend: days.get(date)?.spend ?? 0 };
  });
}

/** Everything the Analytics page shows, computed from daily rows for one filter. */
export function buildReport(input: ReportInput): AnalyticsReport {
  const { campaigns, ads, filter, today, currency } = input;
  const rows = resolveRows(input.rows, input.attribution.source);
  const channels = channelSummaries(input, rows);
  const included = new Set(channels.filter((channel) => channel.included).map((channel) => channel.platform));
  const scoped = rows.filter((row) => included.has(row.platform) && (!filter.campaignId || row.campaignId === filter.campaignId));
  const length = dayCount(filter.from, filter.to);
  const previous = { from: addDays(filter.from, -length), to: addDays(filter.from, -1) };
  const windowRows = scoped.filter(within(filter.from, filter.to));
  const campaignTotals = sumRows(windowRows);
  const readoutsByKey = readouts(scoped, input, previous);

  return {
    filter, today, currency, previous, channels,
    attribution: attributionFor(input, windowRows),
    readoutsByKey,
    readouts: READOUT_KEYS[input.attribution.source].map((key) => readoutsByKey[key]),
    trace: trace(scoped, channels, campaigns, filter),
    ledger: ledger(windowRows, channels),
    campaigns: campaignRows(windowRows, campaigns.filter((c) => included.has(c.platform)), channels),
    campaignTotals,
    campaignOptions: campaigns.map(({ id, name, platform }) => ({ id, name, platform })),
    ads,
    adTotals: totalsByAd(windowRows),
    previousAdTotals: totalsByAd(scoped.filter(within(previous.from, previous.to))),
    dailySpend: dailySpend(rows, today),
    hasData: campaignTotals.spend > 0 || campaignTotals.conversions > 0 || campaignTotals.leads > 0,
  };
}
