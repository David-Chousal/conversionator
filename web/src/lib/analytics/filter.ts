import type { Platform } from "@/lib/data/types";
import { addDays, type IsoDate } from "./dates";
import { DEFAULT_VIEW_ID } from "./layout";
import type { AnalyticsFilter } from "./types";

export type Query = Record<string, string | string[] | undefined>;

export const HISTORY_DAYS = 180;
export const DEFAULT_DAYS = 30;
export const PRESET_DAYS = [7, 30, 90] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const validDate = (value: string | undefined): value is IsoDate => !!value && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));

export function presetWindow(days: number, today: IsoDate): Pick<AnalyticsFilter, "from" | "to"> {
  return { from: addDays(today, -(days - 1)), to: today };
}

function parseWindow(query: Query, today: IsoDate, defaultDays: number): Pick<AnalyticsFilter, "from" | "to"> {
  const rawFrom = first(query.from);
  const rawTo = first(query.to);
  if (!validDate(rawFrom) || !validDate(rawTo)) return presetWindow(defaultDays, today);
  const earliest = addDays(today, -(HISTORY_DAYS - 1));
  const from = rawFrom < earliest ? earliest : rawFrom;
  const to = rawTo > today ? today : rawTo;
  return from <= to ? { from, to } : presetWindow(defaultDays, today);
}

/** Reads the dashboard filter from the URL, falling back to the person's default range and safe defaults for anything invalid. */
export function parseFilter(query: Query, today: IsoDate, platforms: Platform[], campaignIds: string[], defaultDays: number = DEFAULT_DAYS): AnalyticsFilter {
  const off = first(query.off)?.split(",") ?? [];
  const excluded = platforms.filter((platform) => off.includes(platform));
  const campaign = first(query.campaign);
  return {
    ...parseWindow(query, today, defaultDays), excluded, campaignId: campaign && campaignIds.includes(campaign) ? campaign : null,
    ...(defaultDays === DEFAULT_DAYS ? {} : { defaultDays }),
  };
}

/** The query string for a filter, leaving out anything at its default. */
export function filterToQuery(filter: AnalyticsFilter, today: IsoDate): string {
  const params = new URLSearchParams();
  const fallback = presetWindow(filter.defaultDays ?? DEFAULT_DAYS, today);
  if (filter.from !== fallback.from || filter.to !== fallback.to) {
    params.set("from", filter.from);
    params.set("to", filter.to);
  }
  if (filter.excluded.length > 0) params.set("off", filter.excluded.join(","));
  if (filter.campaignId) params.set("campaign", filter.campaignId);
  return params.toString();
}

export function activePreset(filter: AnalyticsFilter, today: IsoDate): number | null {
  if (filter.to !== today) return null;
  return PRESET_DAYS.find((days) => filter.from === presetWindow(days, today).from) ?? null;
}

/** A link to Analytics for a filter and saved view, leaving out defaults. */
export function analyticsHref(filter: AnalyticsFilter, today: IsoDate, viewId: string): string {
  const params = new URLSearchParams(filterToQuery(filter, today));
  if (viewId !== DEFAULT_VIEW_ID) params.set("view", viewId);
  const query = params.toString();
  return query ? `/analytics?${query}` : "/analytics";
}
