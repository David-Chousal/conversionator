import type { LeadStage, Platform } from "@/lib/data/types";
import { addDays, dayIndex, weekday, type IsoDate } from "./dates";
import type { AdInfo, CampaignInfo, RawDailyRow, UnattributedDay } from "./types";

const HISTORY_DAYS = 180;

interface AdProfile {
  key: string;
  name: string;
  /** Share of the campaign's spend. */
  weight: number;
  /** Multiplier on the campaign's return; separates strong ads from weak ones. */
  quality: number;
}

interface CampaignProfile {
  id: string;
  name: string;
  platform: Platform;
  dailySpend: number;
  roas: number;
  cpc: number;
  ctr: number;
  orderValue: number;
  /** Days before today the campaign launched; omitted for always-on campaigns. */
  launchedDaysAgo?: number;
  ads: AdProfile[];
}

const ad = (key: string, name: string, weight: number, quality: number): AdProfile => ({ key, name, weight, quality });

// Sample campaigns and ads sized to match the design system's Northwind example (≈$48k over 30 days).
const PROFILES: CampaignProfile[] = [
  { id: "google-brand", name: "Brand search", platform: "google-ads", dailySpend: 140, roas: 7.5, cpc: 0.5, ctr: 0.087, orderValue: 81,
    ads: [ad("rsa-returns", "RSA · Free returns", 0.6, 1.08), ad("rsa-brand", "RSA · Official store", 0.4, 0.88)] },
  { id: "google-spring-sale", name: "Spring sale · Shopping", platform: "google-ads", dailySpend: 330, roas: 4.5, cpc: 0.99, ctr: 0.024, orderValue: 72, launchedDaysAgo: 24,
    ads: [ad("pmax-20", "Shopping · 20% off trail", 0.55, 1.12), ad("pmax-road", "Shopping · Road runners", 0.45, 0.85)] },
  { id: "google-generic", name: "Generic · running shoes", platform: "google-ads", dailySpend: 170, roas: 3.0, cpc: 1.1, ctr: 0.03, orderValue: 68,
    ads: [ad("rsa-best", "RSA · Best running shoes", 0.5, 1.1), ad("rsa-wide", "RSA · Wide fit", 0.3, 0.95), ad("rsa-cheap", "RSA · Under $100", 0.2, 0.8)] },
  { id: "google-display", name: "Display remarketing", platform: "google-ads", dailySpend: 75, roas: 2.4, cpc: 0.6, ctr: 0.006, orderValue: 60,
    ads: [ad("disp-cart", "Responsive · Left in cart", 0.6, 1.15), ad("disp-new", "Responsive · New colours", 0.4, 0.78)] },
  { id: "meta-lookalike", name: "Prospecting · Lookalike 2%", platform: "meta-ads", dailySpend: 250, roas: 3.1, cpc: 0.96, ctr: 0.011, orderValue: 75,
    ads: [ad("car-new", "Carousel · New arrivals", 0.45, 1.05), ad("vid-unbox", "Video · 15s unboxing", 0.35, 1.12), ad("img-team", "Image · Run club", 0.2, 0.7)] },
  { id: "meta-retargeting", name: "Retargeting · 7-day viewers", platform: "meta-ads", dailySpend: 150, roas: 4.2, cpc: 0.7, ctr: 0.018, orderValue: 70,
    ads: [ad("dpa", "Catalog · Viewed products", 0.7, 1.08), ad("img-review", "Image · 4.8★ reviews", 0.3, 0.82)] },
  { id: "meta-reels", name: "Reels · Spring drop", platform: "meta-ads", dailySpend: 100, roas: 2.6, cpc: 0.5, ctr: 0.009, orderValue: 66, launchedDaysAgo: 12,
    ads: [ad("reel-creator", "Reel · Creator try-on", 0.6, 1.1), ad("reel-studio", "Reel · Studio cut", 0.4, 0.85)] },
  { id: "linkedin-retail", name: "Decision makers · Retail", platform: "linkedin-ads", dailySpend: 130, roas: 1.9, cpc: 9.2, ctr: 0.0084, orderValue: 400,
    ads: [ad("li-roi", "Single image · ROI calculator", 0.55, 1.1), ad("li-doc", "Document · Retail playbook", 0.45, 0.88)] },
  { id: "linkedin-webinar", name: "Webinar · Q2 pipeline", platform: "linkedin-ads", dailySpend: 100, roas: 2.6, cpc: 7.5, ctr: 0.007, orderValue: 380,
    ads: [ad("li-event", "Event · Live webinar", 0.6, 1.05), ad("li-speaker", "Image · Speaker lineup", 0.4, 0.92)] },
  { id: "linkedin-retargeting", name: "Retargeting · site visitors", platform: "linkedin-ads", dailySpend: 57, roas: 2.2, cpc: 6, ctr: 0.006, orderValue: 350,
    ads: [ad("li-case", "Carousel · Case studies", 0.5, 1.12), ad("li-demo", "Image · Book a demo", 0.5, 0.88)] },
  { id: "tiktok-spark", name: "Spark ads · creators", platform: "tiktok-ads", dailySpend: 180, roas: 2.4, cpc: 0.4, ctr: 0.012, orderValue: 55,
    ads: [ad("tt-haul", "Spark · Creator haul", 0.6, 1.1), ad("tt-pace", "Spark · Pace test", 0.4, 0.85)] },
  { id: "tiktok-infeed", name: "In-feed · spring", platform: "tiktok-ads", dailySpend: 120, roas: 2.0, cpc: 0.35, ctr: 0.01, orderValue: 50,
    ads: [ad("tt-drop", "In-feed · Spring drop", 0.5, 1.05), ad("tt-sale", "In-feed · Sale ends", 0.5, 0.95)] },
  { id: "microsoft-brand", name: "Brand · Bing", platform: "microsoft-ads", dailySpend: 60, roas: 6.0, cpc: 0.45, ctr: 0.07, orderValue: 80,
    ads: [ad("ms-rsa", "RSA · Northwind official", 0.7, 1.05), ad("ms-sitelinks", "RSA · Store finder", 0.3, 0.88)] },
  { id: "microsoft-shopping", name: "Shopping · Bing", platform: "microsoft-ads", dailySpend: 90, roas: 3.5, cpc: 0.7, ctr: 0.02, orderValue: 70,
    ads: [ad("ms-trail", "Shopping · Trail", 0.5, 1.08), ad("ms-road", "Shopping · Road", 0.5, 0.92)] },
];

const WEEKDAY_FACTOR = [1.05, 1.08, 1.1, 1.12, 1.0, 0.82, 0.83];
// Pixels over-claim: HubSpot credits ~78% of platform-reported conversions to the last ad interaction.
const CRM_DEAL_RATIO = 0.78;
const LEADS_PER_DEAL = 4;
const LEAD_STAGE_FACTOR: Record<LeadStage, number> = { lead: 1, mql: 0.55, sql: 0.3 };
// Share of CRM leads that come from no ad (organic search, email, direct).
const UNATTRIBUTED_LEAD_RATIO = 0.43;

/** Deterministic pseudo-random number in [0, 1) for a key on a given day. */
function noise(key: string, date: IsoDate, salt: number): number {
  let hash = 2166136261 ^ salt;
  for (const char of `${key}:${dayIndex(date)}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 15), 2246822507);
  return ((hash ^ (hash >>> 13)) >>> 0) / 4294967296;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function adRow(campaign: CampaignProfile, profile: AdProfile, date: IsoDate, daysAgo: number, leadStage: LeadStage): RawDailyRow {
  const adId = `${campaign.id}--${profile.key}`;
  const trend = 1 + (HISTORY_DAYS - daysAgo) * 0.0015;
  const spend = campaign.dailySpend * profile.weight * trend * WEEKDAY_FACTOR[weekday(date)] * (0.85 + 0.3 * noise(adId, date, 1));
  const platformRevenue = spend * campaign.roas * profile.quality * (0.75 + 0.5 * noise(adId, date, 2));
  const clicks = spend / (campaign.cpc * (0.9 + 0.2 * noise(adId, date, 3)));
  const platformConversions = platformRevenue / campaign.orderValue;
  const crmDeals = platformConversions * CRM_DEAL_RATIO * (0.85 + 0.3 * noise(adId, date, 4));
  return {
    date, platform: campaign.platform, campaignId: campaign.id, adId,
    spend: round2(spend),
    impressions: Math.round(clicks / campaign.ctr),
    clicks: Math.round(clicks),
    platformConversions: Math.round(platformConversions),
    platformRevenue: round2(platformRevenue),
    crmLeads: Math.round(crmDeals * LEADS_PER_DEAL * LEAD_STAGE_FACTOR[leadStage] * (0.8 + 0.4 * noise(adId, date, 5))),
    crmDeals: Math.round(crmDeals),
    crmRevenue: round2(crmDeals * campaign.orderValue * (0.9 + 0.2 * noise(adId, date, 6))),
  };
}

function unattributedDays(rows: RawDailyRow[], today: IsoDate): UnattributedDay[] {
  const byDate = new Map<IsoDate, { leads: number; deals: number; revenue: number }>();
  for (const row of rows) {
    const day = byDate.get(row.date) ?? { leads: 0, deals: 0, revenue: 0 };
    byDate.set(row.date, { leads: day.leads + row.crmLeads, deals: day.deals + row.crmDeals, revenue: day.revenue + row.crmRevenue });
  }
  return Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const date = addDays(today, i - (HISTORY_DAYS - 1));
    const day = byDate.get(date) ?? { leads: 0, deals: 0, revenue: 0 };
    const factor = UNATTRIBUTED_LEAD_RATIO * (0.8 + 0.4 * noise("unattributed", date, 7));
    return { date, leads: Math.round(day.leads * factor), deals: Math.round(day.deals * factor * 0.9), revenue: round2(day.revenue * factor * 0.9) };
  });
}

export interface HistoryChannel {
  platform: Platform;
  dataThrough: IsoDate | null;
}

export interface MockHistory {
  rows: RawDailyRow[];
  campaigns: CampaignInfo[];
  ads: AdInfo[];
  unattributed: UnattributedDay[];
}

/** 180 days of ad-level history for the given channels, ending at each channel's last sync. */
export function generateMockHistory(today: IsoDate, channels: HistoryChannel[], leadStage: LeadStage): MockHistory {
  const profiles = PROFILES.filter((profile) => channels.some((channel) => channel.platform === profile.platform));
  const rows: RawDailyRow[] = [];
  for (const campaign of profiles) {
    const dataThrough = channels.find((channel) => channel.platform === campaign.platform)?.dataThrough;
    if (!dataThrough) continue;
    const launch = Math.min(HISTORY_DAYS - 1, campaign.launchedDaysAgo ?? HISTORY_DAYS - 1);
    for (let daysAgo = launch; daysAgo >= 0; daysAgo -= 1) {
      const date = addDays(today, -daysAgo);
      if (date > dataThrough) continue;
      for (const profile of campaign.ads) rows.push(adRow(campaign, profile, date, daysAgo, leadStage));
    }
  }
  return {
    rows,
    campaigns: profiles.map((profile) => ({
      id: profile.id, name: profile.name, platform: profile.platform,
      startDate: profile.launchedDaysAgo === undefined ? null : addDays(today, -profile.launchedDaysAgo),
    })),
    ads: profiles.flatMap((campaign) => campaign.ads.map((profile) => ({ id: `${campaign.id}--${profile.key}`, name: profile.name, campaignId: campaign.id, platform: campaign.platform }))),
    unattributed: unattributedDays(rows, today),
  };
}
