import { formatAge } from "@/lib/format";
import { AUTO_SYNC_MS } from "./auto-sync";
import type { Connection } from "./types";

export type SignalState = "ok" | "stale" | "failed" | "off";

export interface Signal {
  state: SignalState;
  lit: number;
  word: string;
  age?: string;
}

export interface SyncSummary extends Signal {
  issues: Connection[];
}

const MINUTE = 60_000;
const SEVERITY: Record<SignalState, number> = { failed: 3, stale: 2, off: 1, ok: 0 };

/** Fresh while the hourly schedule is keeping up; stale once two runs in a row have been missed. */
function barsForAge(elapsedMs: number): number {
  if (elapsedMs < 15 * MINUTE) return 4;
  if (elapsedMs < 2 * AUTO_SYNC_MS) return 3;
  if (elapsedMs < 12 * 60 * MINUTE) return 2;
  return 1;
}

/** Signal bars and word for one connection, per the SignalMeter guidelines. */
export function signalFor(connection: Connection, now: number): Signal {
  if (connection.status === "failed") return { state: "failed", lit: 0, word: "Failed" };
  if (connection.status === "paused") return { state: "off", lit: 0, word: "Paused" };
  if (connection.status === "syncing") return { state: "ok", lit: 4, word: "Syncing" };
  if (!connection.lastSyncedAt) return { state: "off", lit: 0, word: "Not synced" };
  return freshnessSignal(connection.lastSyncedAt, now);
}

/** Bars and word for how long ago something last synced. */
export function freshnessSignal(lastSyncedAt: string, now: number): Signal {
  const elapsed = now - Date.parse(lastSyncedAt);
  const lit = barsForAge(elapsed);
  const state = lit >= 3 ? "ok" : "stale";
  return { state, lit, word: state === "ok" ? "Synced" : "Stale", age: formatAge(elapsed) };
}

/** Workspace-wide signal for the top bar, plus the connections that need attention. */
export function summarizeSync(connections: Connection[], now: number): SyncSummary {
  const connected = connections.filter((c) => c.status !== "available");
  if (connected.length === 0) return { state: "off", lit: 0, word: "No channels", issues: [] };

  const signals = connected.map((connection) => ({ connection, signal: signalFor(connection, now) }));
  const worst = signals.reduce((a, b) => (SEVERITY[b.signal.state] > SEVERITY[a.signal.state] ? b : a));
  const synced = signals.filter(({ signal }) => signal.state === "ok").length;
  const issues = signals
    .filter(({ signal }) => signal.state !== "ok")
    .sort((a, b) => SEVERITY[b.signal.state] - SEVERITY[a.signal.state])
    .map(({ connection }) => connection);

  return {
    state: worst.signal.state,
    lit: Math.min(...signals.map(({ signal }) => signal.lit)),
    word: `${synced} of ${connected.length} synced`,
    issues,
  };
}
