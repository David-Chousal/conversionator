import { cache } from "react";
import { connection } from "next/server";
import { dataSource } from "./index";
import { signalFor, summarizeSync, type Signal, type SyncSummary } from "./sync";
import type { Connection } from "./types";
import { buildConnectionRows, type ConnectionRows } from "./connections-view";

export interface SyncSnapshot {
  summary: SyncSummary;
  issues: { connection: Connection; signal: Signal }[];
}

/** Current sync health, deduped per request. Ages depend on the clock, so this always runs at request time. */
export const loadSyncSnapshot = cache(async (): Promise<SyncSnapshot> => {
  await connection();
  const connections = await dataSource.listConnections();
  const now = Date.now();
  const summary = summarizeSync(connections, now);
  return {
    summary,
    issues: summary.issues.map((issue) => ({ connection: issue, signal: signalFor(issue, now) })),
  };
});

export interface ConnectionsPageData extends ConnectionRows {
  canManage: boolean;
}

/** Rows for the Connections page plus whether the viewer may change them. Request time only. */
export async function loadConnectionsPage(): Promise<ConnectionsPageData> {
  await connection();
  const [connections, user] = await Promise.all([dataSource.listConnections(), dataSource.getCurrentUser()]);
  return { ...buildConnectionRows(connections, Date.now()), canManage: user.role === "admin" };
}
