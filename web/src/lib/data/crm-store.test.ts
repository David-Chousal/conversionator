import { beforeEach, describe, expect, test } from "vitest";
import { createCrmStore, type CrmStore } from "./crm-store";
import { DataSourceError } from "./errors";
import { FIRST_SYNC_MS } from "./mock-store";

const START = Date.parse("2026-03-30T17:00:00Z");

describe("CRM store", () => {
  let clock: number;
  let crm: CrmStore;

  beforeEach(() => {
    clock = START;
    crm = createCrmStore(() => clock);
  });

  test("seeds HubSpot connected, counting leads at MQL and conversions at closed won, by last ad interaction", () => {
    expect(crm.get()).toMatchObject({
      provider: "hubspot", name: "HubSpot", status: "connected",
      leadStage: "mql", dealStage: "closed-won", attributionModel: "last-ad-interaction",
    });
    expect(crm.get().records.contacts).toBeGreaterThan(0);
  });

  test("disconnecting deletes its records and makes it available", () => {
    crm.disconnect();
    expect(crm.get()).toMatchObject({ status: "available", lastSyncedAt: null, records: { contacts: 0, deals: 0 } });
  });

  test("connecting runs a first sync, then connects", () => {
    crm.disconnect();
    expect(crm.connect().status).toBe("syncing");
    clock += FIRST_SYNC_MS / 2;
    expect(crm.get().syncProgress?.percent).toBe(50);
    clock += FIRST_SYNC_MS;
    expect(crm.get()).toMatchObject({ status: "connected", lastSyncedAt: new Date(START + FIRST_SYNC_MS).toISOString() });
  });

  test("refuses to connect twice", () => {
    expect(() => crm.connect()).toThrowError(DataSourceError);
  });

  test("syncs on demand and reports records", () => {
    clock += 60_000;
    expect(crm.sync().rows).toBeGreaterThan(0);
    expect(crm.get().lastSyncedAt).toBe(new Date(clock).toISOString());
  });

  test("won't sync when nothing is connected", () => {
    crm.disconnect();
    expect(() => crm.sync()).toThrowError(/Connect HubSpot/);
  });

  test("changes the lifecycle stage that counts as a lead", () => {
    expect(crm.updateSettings({ leadStage: "sql" }).leadStage).toBe("sql");
  });

  test("rejects an unknown lead stage", () => {
    expect(() => crm.updateSettings({ leadStage: "vip" as never })).toThrowError(DataSourceError);
  });

  test("lists HubSpot's datasets with contacts and deals locked on", () => {
    expect(crm.datasets().map((d) => [d.id, d.enabled, Boolean(d.required)])).toEqual([["contacts", true, true], ["deals", true, true], ["lifecycle-stages", true, false]]);
  });

  test("turns optional datasets off but refuses required ones", () => {
    expect(crm.setDatasetEnabled("lifecycle-stages", false).find((d) => d.id === "lifecycle-stages")?.enabled).toBe(false);
    expect(() => crm.setDatasetEnabled("contacts", false)).toThrowError(/Attribution needs contacts/);
  });
});
