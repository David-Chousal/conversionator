import { describe, expect, test } from "vitest";
import { signalFor, summarizeSync } from "./sync";
import type { Connection } from "./types";

const NOW = Date.parse("2026-03-30T17:00:00Z");
const minutesAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

function connection(overrides: Partial<Connection>): Connection {
  return {
    id: "c1",
    channelCode: "CH·01",
    platform: "google-ads",
    name: "Google Ads",
    account: "Account 482-119-3307",
    status: "connected",
    lastSyncedAt: minutesAgo(4),
    nextSyncAt: null,
    datasets: { enabled: 4, total: 6 },
    ...overrides,
  };
}

describe("signalFor", () => {
  test("shows four bars when synced under 15 minutes ago", () => {
    expect(signalFor(connection({}), NOW)).toEqual({ state: "ok", lit: 4, word: "Synced", age: "4m" });
  });

  test("shows three bars when synced under an hour ago", () => {
    expect(signalFor(connection({ lastSyncedAt: minutesAgo(40) }), NOW).lit).toBe(3);
  });

  test("marks data older than an hour as stale with two bars", () => {
    expect(signalFor(connection({ lastSyncedAt: minutesAgo(6 * 60) }), NOW)).toEqual({ state: "stale", lit: 2, word: "Stale", age: "6h" });
  });

  test("drops to one bar past 12 hours", () => {
    expect(signalFor(connection({ lastSyncedAt: minutesAgo(13 * 60) }), NOW).lit).toBe(1);
  });

  test("shows no bars for a failed connection", () => {
    expect(signalFor(connection({ status: "failed" }), NOW)).toMatchObject({ state: "failed", lit: 0, word: "Failed" });
  });

  test("shows a paused connection as off", () => {
    expect(signalFor(connection({ status: "paused" }), NOW)).toMatchObject({ state: "off", lit: 0, word: "Paused" });
  });
});

describe("summarizeSync", () => {
  test("counts synced connections and reports the worst state", () => {
    const summary = summarizeSync(
      [connection({}), connection({ id: "c2", lastSyncedAt: minutesAgo(6 * 60) }), connection({ id: "c3", status: "failed" })],
      NOW,
    );
    expect(summary).toMatchObject({ state: "failed", lit: 0, word: "1 of 3 synced" });
  });

  test("lists connections that need attention, failures first", () => {
    const stale = connection({ id: "stale", lastSyncedAt: minutesAgo(6 * 60) });
    const failed = connection({ id: "failed", status: "failed" });
    const ids = summarizeSync([stale, connection({}), failed], NOW).issues.map((c) => c.id);
    expect(ids).toEqual(["failed", "stale"]);
  });

  test("ignores platforms that are not connected", () => {
    const summary = summarizeSync([connection({}), connection({ id: "t", status: "available", lastSyncedAt: null })], NOW);
    expect(summary.word).toBe("1 of 1 synced");
  });

  test("reports no signal when nothing is connected", () => {
    expect(summarizeSync([], NOW)).toMatchObject({ state: "off", lit: 0, word: "No channels" });
  });
});
