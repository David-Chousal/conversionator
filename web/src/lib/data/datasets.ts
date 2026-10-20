import type { Platform } from "./types";

export type DatasetSourceKind = Platform | "hubspot";
export type ColumnFormat = "text" | "money" | "count" | "percent" | "date";

export interface DatasetColumn {
  key: string;
  label: string;
  format: ColumnFormat;
}

export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  defaultOn: boolean;
  /** Why the dataset can't be turned off, when it can't. */
  required?: string;
  columns: DatasetColumn[];
}

const col = (key: string, label: string, format: ColumnFormat = "text"): DatasetColumn => ({ key, label, format });
const set = (id: string, name: string, description: string, defaultOn: boolean, columns: DatasetColumn[], required?: string): DatasetInfo => ({ id, name, description, defaultOn, columns, ...(required ? { required } : {}) });

const CAMPAIGNS = set("campaigns", "Campaigns", "Every campaign with its status and 30-day delivery.", true, [col("name", "Campaign"), col("status", "Status"), col("spend", "Spend · 30d", "money"), col("clicks", "Clicks", "count"), col("conversions", "Conv. · platform", "count")]);
const ADS = (on: boolean) => set("ads", "Ads", "Each ad and the campaign it runs in.", on, [col("name", "Ad"), col("campaign", "Campaign"), col("spend", "Spend · 30d", "money"), col("clicks", "Clicks", "count"), col("ctr", "CTR", "percent")]);
const SPEND = set("spend-daily", "Spend by day", "Daily spend, impressions and clicks; what every chart is built on.", true, [col("date", "Date", "date"), col("spend", "Spend", "money"), col("impressions", "Impressions", "count"), col("clicks", "Clicks", "count")]);
const CONVERSIONS = set("conversions-daily", "Conversions by day", "The platform's own conversion counts and values.", true, [col("date", "Date", "date"), col("conversions", "Conv. · platform", "count"), col("value", "Value · platform", "money")]);
const TERMS = set("search-terms", "Search terms", "What people searched before clicking.", false, [col("term", "Search term"), col("clicks", "Clicks", "count"), col("cost", "Cost", "money"), col("conversions", "Conv. · platform", "count")]);
const AUDIENCES = set("audiences", "Audiences", "Targeted and remarketing audiences.", false, [col("name", "Audience"), col("size", "Size", "count"), col("spend", "Spend · 30d", "money")]);

export const DATASETS: Record<DatasetSourceKind, DatasetInfo[]> = {
  "google-ads": [CAMPAIGNS, ADS(true), SPEND, CONVERSIONS, TERMS, AUDIENCES],
  "meta-ads": [CAMPAIGNS, ADS(true), SPEND, AUDIENCES, set("placements", "Placements", "Feed, Stories, Reels and other placements.", false, [col("name", "Placement"), col("impressions", "Impressions", "count"), col("spend", "Spend · 30d", "money")])],
  "linkedin-ads": [CAMPAIGNS, SPEND, ADS(false), set("lead-forms", "Lead gen forms", "Native LinkedIn forms and their submissions.", false, [col("name", "Form"), col("leads", "Submissions", "count"), col("cpl", "Cost per submission", "money")])],
  "tiktok-ads": [CAMPAIGNS, ADS(true), SPEND, set("video-views", "Video views", "Views and completion rates per ad.", false, [col("name", "Ad"), col("views", "Views", "count"), col("completion", "Completion", "percent")])],
  "microsoft-ads": [CAMPAIGNS, ADS(true), SPEND, TERMS],
  hubspot: [
    set("contacts", "Contacts", "People in the CRM, their lifecycle stage and the ad they came from.", true, [col("id", "Contact"), col("stage", "Lifecycle stage"), col("source", "Original source"), col("ad", "Attributed ad"), col("created", "Created", "date")], "Attribution needs contacts to match leads to ads."),
    set("deals", "Deals", "Deals with their stage and amount; closed won is revenue.", true, [col("id", "Deal"), col("stage", "Stage"), col("amount", "Amount", "money"), col("ad", "Attributed ad"), col("closed", "Close date", "date")], "Attribution needs deals to credit revenue to ads."),
    set("lifecycle-stages", "Lifecycle stages", "How many contacts sit at each stage.", true, [col("stage", "Stage"), col("contacts", "Contacts", "count"), col("share", "Share", "percent")]),
  ],
};

export function datasetsFor(kind: DatasetSourceKind): DatasetInfo[] {
  return DATASETS[kind];
}

export function defaultEnabled(kind: DatasetSourceKind): string[] {
  return DATASETS[kind].filter((dataset) => dataset.defaultOn).map((dataset) => dataset.id);
}

export function datasetInfo(kind: DatasetSourceKind, id: string): DatasetInfo {
  const info = DATASETS[kind].find((dataset) => dataset.id === id);
  if (!info) throw new Error(`Unknown dataset ${id} for ${kind}`);
  return info;
}

export interface DatasetState {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** Turned on since the last sync, so no records yet. */
  pending: boolean;
  required?: string;
}

export interface DatasetSelection {
  enabled: string[];
  pending: string[];
}

export function datasetStates(kind: DatasetSourceKind, selection: DatasetSelection): DatasetState[] {
  return DATASETS[kind].map((info) => ({
    id: info.id, name: info.name, description: info.description, required: info.required,
    enabled: selection.enabled.includes(info.id),
    pending: selection.pending.includes(info.id),
  }));
}

/** Turns a dataset on (pending until the next sync) or off. Returns null if the dataset can't change that way. */
export function toggleDataset(kind: DatasetSourceKind, selection: DatasetSelection, id: string, on: boolean): DatasetSelection | { error: string } {
  const info = DATASETS[kind].find((dataset) => dataset.id === id);
  if (!info) return { error: "That dataset isn't available for this source." };
  if (!on && info.required) return { error: info.required };
  const wasOn = selection.enabled.includes(id);
  if (on === wasOn) return selection;
  if (on) return { enabled: [...selection.enabled, id], pending: [...selection.pending, id] };
  return { enabled: selection.enabled.filter((entry) => entry !== id), pending: selection.pending.filter((entry) => entry !== id) };
}

/** HubSpot's id as a data source; ad platforms use their connection id. */
export const CRM_SOURCE_ID = "crm-hubspot";

export interface DatasetSummary extends DatasetState {
  /** Records stored, or null while the dataset is off or waiting for a sync. */
  records: number | null;
  updatedAt: string | null;
}
