import { todayIn } from "@/lib/analytics/dates";
import { CRM_SOURCE_ID, type DatasetSummary } from "./datasets";
import type { CrmStore } from "./crm-store";
import { DataSourceError } from "./errors";
import { allRecords, mockRecords, type RecordPage, type RecordQuery, type RecordSource } from "./mock-records";
import type { MockStore } from "./mock-store";
import type { Workspace } from "./types";

interface Stores {
  store: MockStore;
  crm: CrmStore;
  workspace: Workspace;
}

function resolve({ store, crm, workspace }: Stores, sourceId: string, now: number): { source: RecordSource; lastSyncedAt: string | null } {
  const dayOf = (iso: string | null) => (iso ? todayIn(workspace.timeZone, Date.parse(iso)) : null);
  const today = todayIn(workspace.timeZone, now);
  if (sourceId === CRM_SOURCE_ID) {
    const connection = crm.get();
    if (connection.status === "available") throw new DataSourceError("not_connected", "HubSpot isn't connected. Connect it in Settings.");
    const datasets = crm.datasets();
    const synced = connection.status !== "syncing" ? connection.lastSyncedAt : null;
    return {
      lastSyncedAt: synced,
      source: { kind: "hubspot", today, dataThrough: dayOf(synced), enabled: datasets.filter((d) => d.enabled).map((d) => d.id), pending: datasets.filter((d) => d.pending).map((d) => d.id), records: connection.records },
    };
  }
  const connection = store.listConnections().find((entry) => entry.id === sourceId && entry.status !== "available");
  if (!connection) throw new DataSourceError("not_found", "That source isn't connected. Pick another or connect it first.");
  const datasets = store.datasets(sourceId);
  const synced = connection.status !== "syncing" ? connection.lastSyncedAt : null;
  return {
    lastSyncedAt: synced,
    source: { kind: connection.platform, today, dataThrough: dayOf(synced), enabled: datasets.filter((d) => d.enabled).map((d) => d.id), pending: datasets.filter((d) => d.pending).map((d) => d.id) },
  };
}

export function mockListDatasets(stores: Stores, sourceId: string, now: number): DatasetSummary[] {
  const { source, lastSyncedAt } = resolve(stores, sourceId, now);
  const states = sourceId === CRM_SOURCE_ID ? stores.crm.datasets() : stores.store.datasets(sourceId);
  return states.map((state) => {
    const ready = state.enabled && !state.pending && source.dataThrough !== null;
    return { ...state, records: ready ? allRecords(source, state.id).length : null, updatedAt: ready ? lastSyncedAt : null };
  });
}

export function mockListRecords(stores: Stores, sourceId: string, datasetId: string, query: RecordQuery, now: number): RecordPage {
  const { source } = resolve(stores, sourceId, now);
  const known = (sourceId === CRM_SOURCE_ID ? stores.crm.datasets() : stores.store.datasets(sourceId)).some((d) => d.id === datasetId);
  if (!known) throw new DataSourceError("not_found", "That dataset isn't available for this source.");
  return mockRecords(source, datasetId, query);
}

export function mockSetDatasetEnabled({ store, crm }: Stores, sourceId: string, datasetId: string, enabled: boolean): void {
  if (sourceId === CRM_SOURCE_ID) crm.setDatasetEnabled(datasetId, enabled);
  else store.setDatasetEnabled(sourceId, datasetId, enabled);
}
