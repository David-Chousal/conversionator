import { describe, expect, test } from "vitest";
import { buildConnectionRows } from "./connections-view";
import { createMockStore } from "./mock-store";

const NOW = Date.parse("2026-03-30T17:00:00Z");

describe("buildConnectionRows", () => {
  const rows = buildConnectionRows(createMockStore(() => NOW, { revoked: ["linkedin-ads"] }).listConnections(), NOW);

  test("splits connected platforms from available ones", () => {
    expect(rows.connected.map((row) => row.connection.name)).toEqual(["Google Ads", "Meta Ads", "LinkedIn Ads"]);
    expect(rows.available.map((row) => row.connection.name)).toEqual(["TikTok Ads", "Microsoft Ads"]);
  });

  test("attaches signal, account line and monogram to each row", () => {
    const meta = rows.connected[1];
    expect(meta.signal).toMatchObject({ state: "ok", lit: 3, age: "22m" });
    expect(meta.account.tone).toBe("normal");
    expect(meta.timing).toBe("Auto · next in 38m");
    expect(rows.connected[2].timing).toBeNull();
    expect(meta.monogram).toBe("M");
  });
});
