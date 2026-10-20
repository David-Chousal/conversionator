import { beforeEach, describe, expect, test } from "vitest";
import { createMockStore, FIRST_SYNC_MS, type MockStore } from "./mock-store";
import { DataSourceError } from "./errors";

const START = Date.parse("2026-03-30T17:00:00Z");
const MINUTE = 60_000;

describe("mock store", () => {
  let clock: number;
  let store: MockStore;

  beforeEach(() => {
    clock = START;
    store = createMockStore(() => clock, { revoked: ["linkedin-ads"] });
  });

  const byPlatform = (platform: string) => store.listConnections().find((c) => c.platform === platform)!;

  test("seeds three ad channels and lists the other ad platforms as available", () => {
    const statuses = store.listConnections().map((c) => [c.name, c.channelCode, c.status]);
    expect(statuses).toEqual([
      ["Google Ads", "CH·01", "connected"],
      ["Meta Ads", "CH·02", "connected"],
      ["LinkedIn Ads", "CH·03", "failed"],
      ["TikTok Ads", "", "available"],
      ["Microsoft Ads", "", "available"],
    ]);
  });

  test("starts healthy by default: nothing needs a person", () => {
    const fresh = createMockStore(() => START).listConnections().filter((c) => c.status !== "available");
    expect(fresh.map((c) => c.status)).toEqual(["connected", "connected", "connected"]);
  });

  describe("automatic sync", () => {
    test("syncs every hour on its own and says when the next run is", () => {
      const before = byPlatform("google-ads");
      clock += 3 * 60 * MINUTE;
      const after = byPlatform("google-ads");
      expect(Date.parse(after.lastSyncedAt!)).toBe(Date.parse(before.lastSyncedAt!) + 3 * 60 * MINUTE);
      expect(Date.parse(after.nextSyncAt!)).toBe(Date.parse(after.lastSyncedAt!) + 60 * MINUTE);
    });

    test("doesn't sync a connection whose access was revoked", () => {
      clock += 3 * 60 * MINUTE;
      expect(byPlatform("linkedin-ads")).toMatchObject({ status: "failed", nextSyncAt: null });
    });
  });

  test("never lists a CRM as an ad connection", () => {
    expect(store.listConnections().some((c) => c.name === "HubSpot")).toBe(false);
  });

  describe("connect", () => {
    test("starts a first sync with the next channel code", () => {
      const created = store.connect("tiktok-ads");
      expect(created).toMatchObject({ channelCode: "CH·04", status: "syncing", syncProgress: { percent: 0, rows: 0 } });
    });

    test("reports first-sync progress as time passes", () => {
      store.connect("tiktok-ads");
      clock += FIRST_SYNC_MS / 2;
      expect(byPlatform("tiktok-ads").syncProgress?.percent).toBe(50);
    });

    test("becomes connected when the first sync finishes", () => {
      store.connect("tiktok-ads");
      clock += FIRST_SYNC_MS + MINUTE;
      expect(byPlatform("tiktok-ads")).toMatchObject({ status: "connected", lastSyncedAt: new Date(START + FIRST_SYNC_MS).toISOString() });
    });

    test("fails the first attempt for a platform set up to fail, with a reason", () => {
      store.connect("microsoft-ads");
      clock += FIRST_SYNC_MS;
      expect(byPlatform("microsoft-ads")).toMatchObject({ status: "failed", failureReason: expect.stringContaining("no ad accounts") });
    });

    test("refuses a platform that is already connected", () => {
      expect(() => store.connect("google-ads")).toThrowError(DataSourceError);
    });
  });

  describe("reconnect", () => {
    test("clears a failure and syncs immediately", () => {
      const linkedin = byPlatform("linkedin-ads");
      store.reconnect(linkedin.id);
      expect(byPlatform("linkedin-ads")).toMatchObject({ status: "connected", lastSyncedAt: new Date(START).toISOString(), failureReason: undefined });
    });

    test("retries a failed first sync, which then succeeds", () => {
      const created = store.connect("microsoft-ads");
      clock += FIRST_SYNC_MS;
      store.reconnect(created.id);
      clock += FIRST_SYNC_MS;
      expect(byPlatform("microsoft-ads").status).toBe("connected");
    });

  });

  describe("syncNow", () => {
    test("updates the last sync time and reports rows", () => {
      const google = byPlatform("google-ads");
      clock += 30 * MINUTE;
      const result = store.syncNow(google.id);
      expect(result.rows).toBeGreaterThan(0);
      expect(byPlatform("google-ads").lastSyncedAt).toBe(new Date(clock).toISOString());
    });

    test("asks for a reconnect when the connection has failed", () => {
      const linkedin = byPlatform("linkedin-ads");
      expect(() => store.syncNow(linkedin.id)).toThrowError(/Reconnect LinkedIn Ads/);
    });

    test("refuses while the first sync is still running", () => {
      const created = store.connect("tiktok-ads");
      expect(() => store.syncNow(created.id)).toThrowError(/already syncing/);
    });
  });

  describe("disconnect", () => {
    test("removes the connection and lists the platform as available again", () => {
      store.disconnect(byPlatform("google-ads").id);
      expect(byPlatform("google-ads")).toMatchObject({ status: "available", channelCode: "" });
    });

    test("never reuses a channel code", () => {
      store.disconnect(byPlatform("google-ads").id);
      expect(store.connect("google-ads").channelCode).toBe("CH·04");
    });

    test("errors for an unknown connection", () => {
      expect(() => store.disconnect("nope")).toThrowError(DataSourceError);
    });
  });

  describe("datasets", () => {
    test("lists a connection's datasets with what's on", () => {
      const google = byPlatform("google-ads");
      const datasets = store.datasets(google.id);
      expect(datasets.filter((d) => d.enabled).map((d) => d.id)).toEqual(["campaigns", "ads", "spend-daily", "conversions-daily"]);
      expect(google.datasets).toEqual({ enabled: 4, total: 6 });
    });

    test("turning a dataset on waits for the next sync", () => {
      const google = byPlatform("google-ads");
      store.setDatasetEnabled(google.id, "search-terms", true);
      expect(store.datasets(google.id).find((d) => d.id === "search-terms")).toMatchObject({ enabled: true, pending: true });
      expect(byPlatform("google-ads").datasets.enabled).toBe(5);
      store.syncNow(google.id);
      expect(store.datasets(google.id).find((d) => d.id === "search-terms")?.pending).toBe(false);
    });

    test("turning a dataset off stops pulling it", () => {
      const google = byPlatform("google-ads");
      store.setDatasetEnabled(google.id, "ads", false);
      expect(store.datasets(google.id).find((d) => d.id === "ads")).toMatchObject({ enabled: false, pending: false });
    });

    test("errors for a dataset the platform doesn't have", () => {
      expect(() => store.setDatasetEnabled(byPlatform("google-ads").id, "placements", true)).toThrowError(DataSourceError);
    });
  });
});
