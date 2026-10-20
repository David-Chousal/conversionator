import { addDays, type IsoDate } from "@/lib/analytics/dates";
import { generateMockHistory } from "@/lib/analytics/mock-history";
import type { RawDailyRow } from "@/lib/analytics/types";
import type { Platform } from "./types";

export type RecordRow = Record<string, string | number>;

const RECENT_DAYS = 30;
const DAILY_DAYS = 90;
const HISTORY_DAYS = 180;

/** Deterministic pseudo-random number in [0, 1) for a key. */
export function unit(key: string): number {
  let hash = 2166136261;
  for (const char of key) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
  return ((hash ^ (hash >>> 13)) >>> 0) / 4294967296;
}

const pick = <T,>(list: readonly T[], key: string): T => list[Math.floor(unit(key) * list.length)];
const round2 = (value: number) => Math.round(value * 100) / 100;

function sumBy(rows: RawDailyRow[], key: (row: RawDailyRow) => string) {
  const sums = new Map<string, { spend: number; clicks: number; impressions: number; conversions: number; value: number }>();
  for (const row of rows) {
    const sum = sums.get(key(row)) ?? { spend: 0, clicks: 0, impressions: 0, conversions: 0, value: 0 };
    sums.set(key(row), { spend: sum.spend + row.spend, clicks: sum.clicks + row.clicks, impressions: sum.impressions + row.impressions, conversions: sum.conversions + row.platformConversions, value: sum.value + row.platformRevenue });
  }
  return sums;
}

const SYNTHETIC: Record<string, (platform: Platform, key: (n: number) => string) => RecordRow[]> = {
  "search-terms": (platform, key) => ["running shoes", "trail running shoes", "northwind shoes", "best running shoes 2026", "wide fit running shoes", "running shoes sale", "marathon shoes", "road running shoes women", "running shoes near me", "cushioned running shoes"]
    .map((term, i) => ({ term, clicks: Math.round(80 + unit(key(i)) * 900), cost: round2(60 + unit(key(i + 50)) * 700), conversions: Math.round(unit(key(i + 99)) * 40) })),
  audiences: (platform, key) => ["Site visitors · 30d", "Cart abandoners · 7d", "Lookalike 2% · purchasers", "Run club members", "Email subscribers"]
    .map((name, i) => ({ name, size: Math.round(5000 + unit(key(i)) * 900000), spend: round2(200 + unit(key(i + 20)) * 4000) })),
  placements: (platform, key) => ["Facebook Feed", "Instagram Feed", "Instagram Stories", "Instagram Reels", "Audience Network"]
    .map((name, i) => ({ name, impressions: Math.round(40000 + unit(key(i)) * 900000), spend: round2(300 + unit(key(i + 20)) * 5000) })),
  "lead-forms": (platform, key) => ["Retail playbook download", "Webinar registration", "Book a demo"]
    .map((name, i) => ({ name, leads: Math.round(20 + unit(key(i)) * 300), cpl: round2(40 + unit(key(i + 20)) * 160) })),
  "video-views": (platform, key) => ["Spark · Creator haul", "Spark · Pace test", "In-feed · Spring drop", "In-feed · Sale ends"]
    .map((name, i) => ({ name, views: Math.round(20000 + unit(key(i)) * 600000), completion: round2(0.08 + unit(key(i + 20)) * 0.4) })),
};

/** Records for an ad platform dataset, from the same history Analytics uses. */
export function adRecords(platform: Platform, datasetId: string, today: IsoDate, dataThrough: IsoDate): RecordRow[] {
  const history = generateMockHistory(today, [{ platform, dataThrough }], "lead");
  const recentFrom = addDays(today, -(RECENT_DAYS - 1));
  const recent = history.rows.filter((row) => row.date >= recentFrom);
  if (datasetId === "campaigns") {
    const sums = sumBy(recent, (row) => row.campaignId);
    return history.campaigns.map((campaign) => {
      const sum = sums.get(campaign.id);
      return { name: campaign.name, status: sum ? "Active" : "Paused", spend: round2(sum?.spend ?? 0), clicks: sum?.clicks ?? 0, conversions: sum?.conversions ?? 0 };
    });
  }
  if (datasetId === "ads") {
    const sums = sumBy(recent, (row) => row.adId);
    return history.ads.map((ad) => {
      const sum = sums.get(ad.id) ?? { spend: 0, clicks: 0, impressions: 0 };
      return { name: ad.name, campaign: history.campaigns.find((c) => c.id === ad.campaignId)?.name ?? "", spend: round2(sum.spend), clicks: sum.clicks, ctr: sum.impressions > 0 ? sum.clicks / sum.impressions : 0 };
    });
  }
  if (datasetId === "spend-daily" || datasetId === "conversions-daily") {
    const sums = sumBy(history.rows, (row) => row.date);
    return Array.from({ length: DAILY_DAYS }, (_, i) => addDays(today, -i)).map((date): RecordRow => {
      const sum = sums.get(date) ?? { spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0 };
      return datasetId === "spend-daily"
        ? { date, spend: round2(sum.spend), impressions: sum.impressions, clicks: sum.clicks }
        : { date, conversions: sum.conversions, value: round2(sum.value) };
    });
  }
  const synthetic = SYNTHETIC[datasetId];
  return synthetic ? synthetic(platform, (n) => `${platform}:${datasetId}:${n}`) : [];
}

const STAGES = ["Subscriber", "Lead", "Marketing qualified lead", "Sales qualified lead", "Opportunity", "Customer"] as const;
const STAGE_WEIGHTS = [0.22, 0.3, 0.2, 0.12, 0.07, 0.09];
const SOURCES = ["Paid search", "Paid social", "Organic search", "Email marketing", "Direct traffic"] as const;
const DEAL_STAGES = ["Qualified", "Proposal", "Closed won", "Closed lost"] as const;

function weighted(key: string): string {
  let roll = unit(key);
  for (let i = 0; i < STAGES.length; i += 1) {
    roll -= STAGE_WEIGHTS[i];
    if (roll < 0) return STAGES[i];
  }
  return STAGES[STAGES.length - 1];
}

/** Records for a HubSpot dataset: contacts, deals and lifecycle stage counts. */
export function crmRecords(datasetId: string, today: IsoDate, counts: { contacts: number; deals: number }): RecordRow[] {
  const adNames = generateMockHistory(today, [{ platform: "google-ads", dataThrough: today }, { platform: "meta-ads", dataThrough: today }, { platform: "linkedin-ads", dataThrough: today }], "lead").ads.map((ad) => ad.name);
  const attributedAd = (key: string, source: string) => (source.startsWith("Paid") ? pick(adNames, `${key}:ad`) : "—");
  if (datasetId === "contacts" || datasetId === "lifecycle-stages") {
    const contacts = Array.from({ length: counts.contacts }, (_, i) => {
      const key = `contact:${i}`;
      const source = pick(SOURCES, `${key}:source`);
      return { id: `C-${100001 + i}`, stage: weighted(`${key}:stage`), source, ad: attributedAd(key, source), created: addDays(today, -Math.floor(unit(`${key}:created`) * HISTORY_DAYS)) };
    });
    if (datasetId === "contacts") return contacts;
    return STAGES.map((stage) => {
      const count = contacts.filter((contact) => contact.stage === stage).length;
      return { stage, contacts: count, share: counts.contacts > 0 ? count / counts.contacts : 0 };
    });
  }
  return Array.from({ length: counts.deals }, (_, i) => {
    const key = `deal:${i}`;
    const source = pick(SOURCES, `${key}:source`);
    return { id: `D-${50001 + i}`, stage: pick(DEAL_STAGES, `${key}:stage`), amount: round2(60 + unit(`${key}:amount`) * 900), ad: attributedAd(key, source), closed: addDays(today, -Math.floor(unit(`${key}:closed`) * HISTORY_DAYS)) };
  });
}
