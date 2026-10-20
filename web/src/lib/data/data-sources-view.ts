import { syncTiming } from "./auto-sync";
import { accountLine, type AccountLine } from "./describe";
import { platformInfo } from "./catalog";
import { crmRecordsLine, crmSignal } from "./crm-view";
import { CRM_SOURCE_ID, type DatasetSummary } from "./datasets";
import type { RecordQuery } from "./mock-records";
import { signalFor, type Signal } from "./sync";
import type { Connection, CrmConnection, Platform } from "./types";

export interface SourceItem {
  id: string;
  kind: "ad" | "crm";
  platform: Platform | null;
  name: string;
  /** Channel code for ad platforms, "CRM" for the CRM. */
  code: string;
  monogram: string;
  signal: Signal;
  account: AccountLine;
  datasets: { enabled: number; total: number };
  lastSyncedAt: string | null;
  failed: boolean;
  syncing: boolean;
  /** "Auto · next in 56m" while on the hourly schedule. */
  timing: string | null;
}

type Query = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const MAX_SEARCH_LENGTH = 100;

/** Every source COR pulls from: connected ad platforms by channel code, then the CRM. */
export function buildSources(connections: Connection[], crm: CrmConnection, crmDatasets: { enabled: number; total: number } | null, now: number): SourceItem[] {
  const ads = connections
    .filter((connection) => connection.status !== "available")
    .sort((a, b) => a.channelCode.localeCompare(b.channelCode))
    .map((connection): SourceItem => ({
      id: connection.id, kind: "ad", platform: connection.platform, name: connection.name, code: connection.channelCode,
      monogram: platformInfo(connection.platform).monogram, signal: signalFor(connection, now), account: accountLine(connection),
      datasets: connection.datasets, lastSyncedAt: connection.lastSyncedAt, failed: connection.status === "failed", syncing: connection.status === "syncing",
      timing: syncTiming(connection.lastSyncedAt, connection.nextSyncAt, now),
    }));
  if (crm.status === "available" || !crmDatasets) return ads;
  const failed = crm.status === "failed";
  return [...ads, {
    id: CRM_SOURCE_ID, kind: "crm", platform: null, name: crm.name, code: "CRM", monogram: "H", signal: crmSignal(crm, now),
    account: failed ? { text: crm.failureReason ?? "Sync failed. Reconnect in Settings.", tone: "negative" } : { text: `${crm.account} · ${crmRecordsLine(crm)}`, tone: "normal" },
    datasets: crmDatasets, lastSyncedAt: crm.lastSyncedAt, failed, syncing: crm.status === "syncing",
    timing: syncTiming(crm.lastSyncedAt, crm.nextSyncAt, now),
  }];
}

/** The source named in the URL (by id, or by platform from Analytics links), else the first. */
export function selectSource(sources: SourceItem[], query: Query): SourceItem | null {
  const byId = sources.find((source) => source.id === first(query.source));
  const byPlatform = sources.find((source) => source.platform !== null && source.platform === first(query.platform));
  return byId ?? byPlatform ?? sources[0] ?? null;
}

export function selectDataset(datasets: DatasetSummary[], requested: string | undefined): string | null {
  return datasets.find((dataset) => dataset.id === requested)?.id ?? datasets.find((dataset) => dataset.enabled)?.id ?? datasets[0]?.id ?? null;
}

export function parseRecordQuery(query: Query): RecordQuery {
  const page = Number.parseInt(first(query.page) ?? "1", 10);
  return { search: (first(query.q) ?? "").trim().slice(0, MAX_SEARCH_LENGTH), page: Number.isFinite(page) && page > 0 ? page : 1 };
}

export function dataHref({ source, dataset, search, page }: { source: string; dataset?: string | null; search?: string; page?: number }): string {
  const params = new URLSearchParams({ source });
  if (dataset) params.set("dataset", dataset);
  if (search) params.set("q", search);
  if (page && page > 1) params.set("page", String(page));
  return `/data?${params.toString()}`;
}
