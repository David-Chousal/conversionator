import type { IsoDate } from "@/lib/analytics/dates";
import { datasetInfo, type DatasetColumn, type DatasetSourceKind } from "./datasets";
import { adRecords, crmRecords, type RecordRow } from "./record-generators";

export type { RecordRow };

export const RECORDS_PAGE_SIZE = 25;

export interface RecordSource {
  kind: DatasetSourceKind;
  today: IsoDate;
  /** Last day with data; null while the source has never synced. */
  dataThrough: IsoDate | null;
  enabled: string[];
  pending: string[];
  /** HubSpot only: how many contacts and deals are stored. */
  records?: { contacts: number; deals: number };
}

export interface RecordQuery {
  search: string;
  page: number;
}

export interface RecordPage {
  /** off: not pulled · pending: turned on, waiting for a sync · not-synced: the source has no data yet. */
  state: "ready" | "off" | "pending" | "not-synced";
  columns: DatasetColumn[];
  rows: RecordRow[];
  total: number;
  page: number;
  pageSize: number;
}

/** Every record a dataset holds, before search and paging. */
export function allRecords(source: RecordSource, datasetId: string): RecordRow[] {
  if (!source.dataThrough) return [];
  if (source.kind === "hubspot") return crmRecords(datasetId, source.today, source.records ?? { contacts: 0, deals: 0 });
  return adRecords(source.kind, datasetId, source.today, source.dataThrough);
}

function stateOf(source: RecordSource, datasetId: string): RecordPage["state"] {
  if (!source.enabled.includes(datasetId)) return "off";
  if (source.pending.includes(datasetId)) return "pending";
  if (!source.dataThrough) return "not-synced";
  return "ready";
}

/** One page of a dataset's records, filtered by a case-insensitive search over its text columns. */
export function mockRecords(source: RecordSource, datasetId: string, query: RecordQuery): RecordPage {
  const columns = datasetInfo(source.kind, datasetId).columns;
  const state = stateOf(source, datasetId);
  const page = Math.max(1, Math.floor(query.page) || 1);
  if (state !== "ready") return { state, columns, rows: [], total: 0, page: 1, pageSize: RECORDS_PAGE_SIZE };

  const needle = query.search.trim().toLowerCase();
  const textKeys = columns.filter((column) => column.format === "text").map((column) => column.key);
  const matching = needle ? allRecords(source, datasetId).filter((row) => textKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(needle))) : allRecords(source, datasetId);
  const start = (page - 1) * RECORDS_PAGE_SIZE;
  return { state, columns, rows: matching.slice(start, start + RECORDS_PAGE_SIZE), total: matching.length, page, pageSize: RECORDS_PAGE_SIZE };
}
