import { datasetStates, defaultEnabled, toggleDataset, type DatasetSelection, type DatasetState } from "./datasets";
import { DataSourceError } from "./errors";
import { FIRST_SYNC_MS } from "./mock-store";
import { catchUp, nextSyncAt } from "./auto-sync";
import type { CrmConnection, CrmSettings, LeadStage, SyncResult } from "./types";

const MINUTE = 60_000;
const SEEDED_RECORDS = { contacts: 18_240, deals: 1_310 };
const RECORDS_PER_SYNC = 420;
export const LEAD_STAGES: readonly LeadStage[] = ["lead", "mql", "sql"];

export interface CrmStore {
  get(): CrmConnection;
  connect(): CrmConnection;
  reconnect(): CrmConnection;
  disconnect(): void;
  sync(): SyncResult;
  updateSettings(settings: CrmSettings): CrmConnection;
  datasets(): DatasetState[];
  setDatasetEnabled(datasetId: string, enabled: boolean): DatasetState[];
}

interface CrmRecord {
  status: "connected" | "failed" | "available";
  lastSyncedAt: number | null;
  firstSyncStartedAt?: number;
  leadStage: LeadStage;
  records: { contacts: number; deals: number };
  datasets: DatasetSelection;
}

const iso = (time: number | null) => (time === null ? null : new Date(time).toISOString());

function settle(record: CrmRecord, now: number): CrmRecord {
  const started = record.firstSyncStartedAt;
  if (started === undefined || now - started < FIRST_SYNC_MS) return record;
  return { ...record, firstSyncStartedAt: undefined, status: "connected", lastSyncedAt: started + FIRST_SYNC_MS, records: SEEDED_RECORDS };
}

/** The hourly background sync, for a healthy connection. */
function keepFresh(record: CrmRecord, now: number): CrmRecord {
  if (record.status !== "connected" || record.lastSyncedAt === null || record.firstSyncStartedAt !== undefined) return record;
  return { ...record, lastSyncedAt: catchUp(record.lastSyncedAt, now) };
}

function toConnection(record: CrmRecord, now: number): CrmConnection {
  const base: CrmConnection = {
    provider: "hubspot", name: "HubSpot", account: record.status === "available" ? "Contacts, lifecycle stages, deals and their sources" : "Portal 7731902",
    status: record.status, lastSyncedAt: iso(record.lastSyncedAt),
    nextSyncAt: record.status === "connected" && record.lastSyncedAt !== null ? iso(nextSyncAt(record.lastSyncedAt)) : null,
    leadStage: record.leadStage, dealStage: "closed-won",
    attributionModel: "last-ad-interaction", records: record.records,
  };
  if (record.firstSyncStartedAt === undefined) return base;
  const fraction = (now - record.firstSyncStartedAt) / FIRST_SYNC_MS;
  return { ...base, status: "syncing", syncProgress: { percent: Math.floor(fraction * 100), rows: Math.floor(fraction * SEEDED_RECORDS.contacts) } };
}

/** In-memory HubSpot integration for the mock data source. */
export function createCrmStore(now: () => number): CrmStore {
  let record: CrmRecord = { status: "connected", lastSyncedAt: now() - 12 * MINUTE, leadStage: "mql", records: SEEDED_RECORDS, datasets: { enabled: defaultEnabled("hubspot"), pending: [] } };

  function current(): CrmRecord {
    record = keepFresh(settle(record, now()), now());
    return record;
  }

  return {
    get: () => toConnection(current(), now()),

    connect() {
      if (current().status !== "available") throw new DataSourceError("already_connected", "HubSpot is already connected. Reconnect it instead.");
      record = { ...record, status: "connected", lastSyncedAt: null, firstSyncStartedAt: now(), records: { contacts: 0, deals: 0 } };
      return toConnection(record, now());
    },

    reconnect() {
      if (current().status === "available") throw new DataSourceError("not_connected", "Connect HubSpot first.");
      record = { ...record, status: "connected", lastSyncedAt: now() };
      return toConnection(record, now());
    },

    disconnect() {
      record = { ...current(), status: "available", lastSyncedAt: null, firstSyncStartedAt: undefined, records: { contacts: 0, deals: 0 } };
    },

    sync() {
      const state = current();
      if (state.status === "available") throw new DataSourceError("not_connected", "Connect HubSpot before syncing.");
      if (state.firstSyncStartedAt !== undefined) throw new DataSourceError("sync_in_progress", "HubSpot is already syncing. It will finish on its own.");
      if (state.status === "failed") throw new DataSourceError("needs_reconnect", "Reconnect HubSpot before syncing.");
      const time = now();
      record = { ...state, lastSyncedAt: time, datasets: { ...state.datasets, pending: [] } };
      return { rows: RECORDS_PER_SYNC, finishedAt: new Date(time).toISOString() };
    },

    updateSettings({ leadStage }) {
      if (!LEAD_STAGES.includes(leadStage)) throw new DataSourceError("invalid_input", "Pick Lead, Marketing qualified lead or Sales qualified lead.");
      record = { ...current(), leadStage };
      return toConnection(record, now());
    },

    datasets: () => datasetStates("hubspot", current().datasets),

    setDatasetEnabled(datasetId, enabled) {
      const next = toggleDataset("hubspot", current().datasets, datasetId, enabled);
      if ("error" in next) throw new DataSourceError("invalid_input", next.error);
      record = { ...record, datasets: next };
      return datasetStates("hubspot", next);
    },
  };
}
