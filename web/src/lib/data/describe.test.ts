import { describe, expect, test } from "vitest";
import { accountLine } from "./describe";
import type { Connection } from "./types";

const NOW = Date.parse("2026-03-30T17:00:00Z");

const base: Connection = {
  id: "c", channelCode: "CH·02", platform: "meta-ads", name: "Meta Ads", account: "Business 1029384756",
  status: "connected", lastSyncedAt: new Date(NOW).toISOString(), nextSyncAt: null, datasets: { enabled: 3, total: 5 },
};

describe("accountLine", () => {
  test("shows the account when nothing needs attention", () => {
    expect(accountLine(base)).toEqual({ text: "Business 1029384756", tone: "normal" });
  });

  test("never asks for a reconnect over expiring access: it renews in the background", () => {
    expect(accountLine(base).tone).toBe("normal");
  });

  test("shows the failure reason for a failed connection", () => {
    const failed = { ...base, status: "failed" as const, failureReason: "Meta revoked COR's access." };
    expect(accountLine(failed)).toEqual({ text: "Meta revoked COR's access.", tone: "negative" });
  });

  test("describes the first sync while it runs", () => {
    const syncing = { ...base, status: "syncing" as const, syncProgress: { percent: 38, rows: 6410 } };
    expect(accountLine(syncing).text).toBe("First sync · pulling the last 90 days");
  });

  test("describes what an available platform provides", () => {
    const available = { ...base, status: "available" as const, account: "Spend, video views, conversions" };
    expect(accountLine(available).text).toBe("Spend, video views, conversions");
  });
});
