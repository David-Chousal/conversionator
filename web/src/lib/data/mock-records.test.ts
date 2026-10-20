import { describe, expect, test } from "vitest";
import { mockRecords, type RecordSource } from "./mock-records";

const TODAY = "2026-03-30";
const google: RecordSource = { kind: "google-ads", today: TODAY, dataThrough: TODAY, enabled: ["campaigns", "ads", "spend-daily", "conversions-daily", "search-terms"], pending: [] };
const hubspot: RecordSource = { kind: "hubspot", today: TODAY, dataThrough: TODAY, enabled: ["contacts", "deals", "lifecycle-stages"], pending: [], records: { contacts: 1800, deals: 130 } };
const all = { search: "", page: 1 };

describe("mockRecords", () => {
  test("lists a platform's campaigns with their columns", () => {
    const page = mockRecords(google, "campaigns", all);
    expect(page.state).toBe("ready");
    expect(page.columns.map((column) => column.label)).toEqual(["Campaign", "Status", "Spend · 30d", "Clicks", "Conv. · platform"]);
    expect(page.rows.map((row) => row.name)).toContain("Brand search");
  });

  test("lists spend by day, newest first, for 90 days", () => {
    const page = mockRecords(google, "spend-daily", all);
    expect(page.total).toBe(90);
    expect(page.rows[0].date).toBe(TODAY);
  });

  test("pages 25 rows at a time", () => {
    const page = mockRecords(google, "spend-daily", { search: "", page: 4 });
    expect(page).toMatchObject({ page: 4, pageSize: 25 });
    expect(page.rows).toHaveLength(15);
  });

  test("searches text columns, ignoring case", () => {
    const page = mockRecords(google, "ads", { search: "rsa · wide", page: 1 });
    expect(page.rows.map((row) => row.name)).toEqual(["RSA · Wide fit"]);
  });

  test("says when a dataset is off or waiting for its first sync", () => {
    expect(mockRecords({ ...google, enabled: ["campaigns"] }, "ads", all)).toMatchObject({ state: "off", rows: [], total: 0 });
    expect(mockRecords({ ...google, pending: ["search-terms"] }, "search-terms", all)).toMatchObject({ state: "pending", rows: [] });
    expect(mockRecords({ ...google, dataThrough: null }, "campaigns", all)).toMatchObject({ state: "not-synced", rows: [] });
  });

  test("lists HubSpot contacts with the ad they were attributed to", () => {
    const page = mockRecords(hubspot, "contacts", all);
    expect(page.total).toBe(1800);
    expect(page.rows[0]).toMatchObject({ id: expect.stringMatching(/^C-/), stage: expect.any(String), ad: expect.any(String) });
  });

  test("summarises lifecycle stages with shares adding to 100%", () => {
    const rows = mockRecords(hubspot, "lifecycle-stages", all).rows;
    const share = rows.reduce((sum, row) => sum + Number(row.share), 0);
    expect(share).toBeCloseTo(1, 5);
  });

  test("is deterministic", () => {
    expect(mockRecords(hubspot, "deals", all).rows).toEqual(mockRecords(hubspot, "deals", all).rows);
  });
});
