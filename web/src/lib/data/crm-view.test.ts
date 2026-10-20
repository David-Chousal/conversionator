import { describe, expect, test } from "vitest";
import { crmSignal, crmRecordsLine } from "./crm-view";
import type { CrmConnection } from "./types";

const NOW = Date.parse("2026-03-30T17:00:00Z");
const base: CrmConnection = {
  provider: "hubspot", name: "HubSpot", account: "Portal 7731902", status: "connected", lastSyncedAt: new Date(NOW - 12 * 60_000).toISOString(), nextSyncAt: new Date(NOW + 48 * 60_000).toISOString(),
  leadStage: "mql", dealStage: "closed-won", attributionModel: "last-ad-interaction", records: { contacts: 18240, deals: 1310 },
};

describe("crmSignal", () => {
  test("reads freshness like an ad connection", () => {
    expect(crmSignal(base, NOW)).toEqual({ state: "ok", lit: 4, word: "Synced", age: "12m" });
  });

  test("shows failures and missing connections", () => {
    expect(crmSignal({ ...base, status: "failed" }, NOW)).toMatchObject({ state: "failed", lit: 0 });
    expect(crmSignal({ ...base, status: "available", lastSyncedAt: null }, NOW)).toMatchObject({ state: "off", word: "Not connected" });
  });
});

describe("crmRecordsLine", () => {
  test("counts contacts and deals", () => {
    expect(crmRecordsLine(base)).toBe("18,240 contacts · 1,310 deals");
  });
});
