import type { Connection } from "./types";

export interface AccountLine {
  text: string;
  tone: "normal" | "caution" | "negative";
}

/** The mono line under a connection's name: account, or whatever needs attention. */
export function accountLine(connection: Connection): AccountLine {
  if (connection.status === "failed") return { text: connection.failureReason ?? "Sync failed. Reconnect to resume.", tone: "negative" };
  if (connection.status === "syncing") return { text: "First sync · pulling the last 90 days", tone: "normal" };
  return { text: connection.account, tone: "normal" };
}
