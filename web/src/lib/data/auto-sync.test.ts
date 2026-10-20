import { describe, expect, test } from "vitest";
import { AUTO_SYNC_MS, catchUp, nextSyncAt, renewAccess, syncTiming } from "./auto-sync";

const HOUR = 60 * 60_000;
const NOW = Date.parse("2026-10-18T12:00:00Z");

describe("automatic sync", () => {
  test("runs every hour", () => {
    expect(AUTO_SYNC_MS).toBe(HOUR);
  });

  test("leaves a recent sync alone", () => {
    expect(catchUp(NOW - 20 * 60_000, NOW)).toBe(NOW - 20 * 60_000);
  });

  test("moves a missed sync to the latest scheduled run", () => {
    expect(catchUp(NOW - 2.5 * HOUR, NOW)).toBe(NOW - 0.5 * HOUR);
  });

  test("schedules the next run an hour after the last", () => {
    expect(nextSyncAt(NOW - 20 * 60_000)).toBe(NOW + 40 * 60_000);
  });

  test("renews access in the background before it runs out", () => {
    expect(renewAccess(NOW + 3 * 24 * HOUR, NOW)).toBeGreaterThan(NOW + 30 * 24 * HOUR);
    expect(renewAccess(NOW + 40 * 24 * HOUR, NOW)).toBe(NOW + 40 * 24 * HOUR);
  });

  test("describes when it last synced and when it syncs next", () => {
    expect(syncTiming(new Date(NOW - 4 * 60_000).toISOString(), new Date(NOW + 56 * 60_000).toISOString(), NOW)).toBe("Auto · next in 56m");
    expect(syncTiming(new Date(NOW - 4 * 60_000).toISOString(), new Date(NOW - 60_000).toISOString(), NOW)).toBe("Auto · syncing soon");
    expect(syncTiming(null, null, NOW)).toBeNull();
  });
});
