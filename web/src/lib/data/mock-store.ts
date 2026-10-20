import { PLATFORMS, platformInfo } from "./catalog";
import { datasetStates, defaultEnabled, toggleDataset, type DatasetState } from "./datasets";
import { DataSourceError } from "./errors";
import { catchUp, nextSyncAt, renewAccess } from "./auto-sync";
import type { Connection, Platform, SyncResult } from "./types";

export const FIRST_SYNC_MS = 20_000;
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const TOKEN_LIFETIME_MS = 60 * DAY;
// Demo knob: the first connect attempt for this platform fails, so the retry path can be exercised.
const FAILS_FIRST_ATTEMPT: readonly Platform[] = ["microsoft-ads"];

interface ConnectionRecord {
  id: string;
  channelNumber: number;
  platform: Platform;
  account: string;
  status: "connected" | "failed";
  lastSyncedAt: number | null;
  tokenExpiresAt: number;
  failureReason?: string;
  datasets: { enabled: string[]; pending: string[] };
  attempts: number;
  firstSyncStartedAt?: number;
}

export interface MockStore {
  listConnections(): Connection[];
  connect(platform: Platform): Connection;
  reconnect(connectionId: string): Connection;
  disconnect(connectionId: string): void;
  syncNow(connectionId: string): SyncResult;
  datasets(connectionId: string): DatasetState[];
  setDatasetEnabled(connectionId: string, datasetId: string, enabled: boolean): DatasetState[];
}

const iso = (time: number | null | undefined) => (time == null ? null : new Date(time).toISOString());
const channelCode = (n: number) => `CH·${String(n).padStart(2, "0")}`;


function seed(now: number, revoked: readonly Platform[]): ConnectionRecord[] {
  const record = (n: number, platform: Platform, account: string, extra: Partial<ConnectionRecord>): ConnectionRecord => ({
    id: `con_${platform}`, channelNumber: n, platform, account, status: "connected", lastSyncedAt: now - 5 * MINUTE,
    tokenExpiresAt: now + 40 * DAY, datasets: { enabled: defaultEnabled(platform), pending: [] }, attempts: 1, ...extra,
    ...(revoked.includes(platform) ? { status: "failed" as const, failureReason: `${platformInfo(platform).name} revoked COR's access. Reconnect to resume syncing.` } : {}),
  });
  return [
    record(1, "google-ads", "Account 482-119-3307", { lastSyncedAt: now - 4 * MINUTE }),
    record(2, "meta-ads", "Business 1029384756", { lastSyncedAt: now - 22 * MINUTE, tokenExpiresAt: now + 3 * DAY }),
    record(3, "linkedin-ads", "Account 508-221", { lastSyncedAt: now - 41 * MINUTE }),
  ];
}

/** What the background jobs would have done by now: hourly syncs and access renewal for healthy connections. */
function keepFresh(record: ConnectionRecord, now: number): ConnectionRecord {
  if (record.status !== "connected" || record.lastSyncedAt === null || record.firstSyncStartedAt !== undefined) return record;
  return { ...record, lastSyncedAt: catchUp(record.lastSyncedAt, now), tokenExpiresAt: renewAccess(record.tokenExpiresAt, now) };
}

/** Turn first syncs that have finished into their final state. */
function settle(record: ConnectionRecord, now: number): ConnectionRecord {
  const started = record.firstSyncStartedAt;
  if (started === undefined || now - started < FIRST_SYNC_MS) return record;
  const finished = started + FIRST_SYNC_MS;
  if (FAILS_FIRST_ATTEMPT.includes(record.platform) && record.attempts === 1) {
    return { ...record, firstSyncStartedAt: undefined, status: "failed", failureReason: `First sync failed: ${platformInfo(record.platform).name} returned no ad accounts for this login. Try again, or sign in with an account that runs ads.` };
  }
  return { ...record, firstSyncStartedAt: undefined, status: "connected", lastSyncedAt: finished };
}

function toConnection(record: ConnectionRecord, now: number): Connection {
  const info = platformInfo(record.platform);
  const base: Connection = {
    id: record.id, channelCode: channelCode(record.channelNumber), platform: record.platform, name: info.name, account: record.account,
    status: record.status, lastSyncedAt: iso(record.lastSyncedAt), datasets: { enabled: record.datasets.enabled.length, total: datasetStates(record.platform, record.datasets).length },
    failureReason: record.failureReason,
    nextSyncAt: record.status === "connected" && record.lastSyncedAt !== null ? iso(nextSyncAt(record.lastSyncedAt)) : null,
  };
  if (record.firstSyncStartedAt === undefined) return base;
  const fraction = (now - record.firstSyncStartedAt) / FIRST_SYNC_MS;
  return { ...base, status: "syncing", syncProgress: { percent: Math.floor(fraction * 100), rows: Math.floor(fraction * info.rowsPerSync * 3) } };
}

function availableEntry(platform: Platform): Connection {
  const info = platformInfo(platform);
  return {
    id: `available_${platform}`, channelCode: "", platform, name: info.name, account: info.provides, status: "available",
    lastSyncedAt: null, nextSyncAt: null, datasets: { enabled: 0, total: datasetStates(platform, { enabled: [], pending: [] }).length },
  };
}

/** `revoked` starts those platforms with access revoked, the one case that still needs a person to reconnect. */
export function createMockStore(now: () => number, { revoked = [] }: { revoked?: readonly Platform[] } = {}): MockStore {
  let records = seed(now(), revoked);
  let nextChannelNumber = records.length + 1;

  function settled(): ConnectionRecord[] {
    const time = now();
    records = records.map((record) => keepFresh(settle(record, time), time));
    return records;
  }

  function find(connectionId: string): ConnectionRecord {
    const record = settled().find((entry) => entry.id === connectionId);
    if (!record) throw new DataSourceError("not_found", "That connection no longer exists. Refresh the page.");
    return record;
  }

  function replace(updated: ConnectionRecord): Connection {
    records = records.map((record) => (record.id === updated.id ? updated : record));
    return toConnection(updated, now());
  }

  return {
    listConnections() {
      const time = now();
      const connected = [...settled()].sort((a, b) => a.channelNumber - b.channelNumber).map((record) => toConnection(record, time));
      const taken = new Set(records.map((record) => record.platform));
      const available = PLATFORMS.filter((info) => !taken.has(info.platform)).map((info) => availableEntry(info.platform));
      return [...connected, ...available];
    },

    connect(platform) {
      const info = platformInfo(platform);
      if (settled().some((record) => record.platform === platform)) {
        throw new DataSourceError("already_connected", `${info.name} is already connected. Reconnect it from its row instead.`);
      }
      const time = now();
      const record: ConnectionRecord = {
        id: `con_${platform}_${time}`, channelNumber: nextChannelNumber, platform, account: `${info.name} account`, status: "connected",
        lastSyncedAt: null, tokenExpiresAt: time + TOKEN_LIFETIME_MS, datasets: { enabled: defaultEnabled(platform), pending: [] }, attempts: 1, firstSyncStartedAt: time,
      };
      nextChannelNumber += 1;
      records = [...records, record];
      return toConnection(record, time);
    },

    reconnect(connectionId) {
      const record = find(connectionId);
      const time = now();
      const renewed = { ...record, status: "connected" as const, failureReason: undefined, tokenExpiresAt: time + TOKEN_LIFETIME_MS, attempts: record.attempts + 1 };
      const neverSynced = record.lastSyncedAt === null;
      return replace(neverSynced ? { ...renewed, firstSyncStartedAt: time } : { ...renewed, lastSyncedAt: time });
    },

    disconnect(connectionId) {
      find(connectionId);
      records = records.filter((record) => record.id !== connectionId);
    },

    syncNow(connectionId) {
      const record = find(connectionId);
      const info = platformInfo(record.platform);
      if (record.firstSyncStartedAt !== undefined) throw new DataSourceError("sync_in_progress", `${info.name} is already syncing. It will finish on its own.`);
      if (record.status === "failed") throw new DataSourceError("needs_reconnect", `Reconnect ${info.name} before syncing.`);
      const time = now();
      replace({ ...record, lastSyncedAt: time, datasets: { ...record.datasets, pending: [] } });
      return { rows: info.rowsPerSync, finishedAt: new Date(time).toISOString() };
    },

    datasets(connectionId) {
      const record = find(connectionId);
      return datasetStates(record.platform, record.datasets);
    },

    setDatasetEnabled(connectionId, datasetId, enabled) {
      const record = find(connectionId);
      const next = toggleDataset(record.platform, record.datasets, datasetId, enabled);
      if ("error" in next) throw new DataSourceError("invalid_input", next.error);
      replace({ ...record, datasets: next });
      return datasetStates(record.platform, next);
    },
  };
}
