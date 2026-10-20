import { platformInfo } from "./catalog";
import { syncTiming } from "./auto-sync";
import { accountLine, type AccountLine } from "./describe";
import { signalFor, type Signal } from "./sync";
import type { Connection } from "./types";

export interface ConnectionRowView {
  connection: Connection;
  signal: Signal;
  account: AccountLine;
  monogram: string;
  /** "Auto · next in 38m" while on the hourly schedule; null otherwise. */
  timing: string | null;
}

export interface ConnectionRows {
  connected: ConnectionRowView[];
  available: ConnectionRowView[];
}

/** Everything a connection row needs that depends on the clock, computed once on the server. */
export function buildConnectionRows(connections: Connection[], now: number): ConnectionRows {
  const rows = connections.map((connection) => ({
    connection,
    signal: signalFor(connection, now),
    account: accountLine(connection),
    monogram: platformInfo(connection.platform).monogram,
    timing: syncTiming(connection.lastSyncedAt, connection.nextSyncAt, now),
  }));
  return {
    connected: rows.filter((row) => row.connection.status !== "available"),
    available: rows.filter((row) => row.connection.status === "available"),
  };
}
