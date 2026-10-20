import { describe, expect, test } from "vitest";
import { createReportStore } from "./store";
import type { ReportInput } from "./types";

const NOW = Date.parse("2026-10-18T12:00:00Z");
const admin = { id: "u_david", name: "David Chousal", role: "admin" as const };
const member = { id: "u_troy", name: "Troy Edwards", role: "member" as const };
const ctx = { available: ["google-ads" as const, "meta-ads" as const], today: "2026-10-18" };
const input: ReportInput = { name: "Spend check", metrics: ["spend"], platforms: ["google-ads"], window: { kind: "rolling", days: 7 }, compare: false, format: "csv", schedule: "weekly", recipients: ["Ops@Northwind.co", "ops@northwind.co"] };

describe("report store", () => {
  test("starts with sample reports, newest first", () => {
    const reports = createReportStore(() => NOW).list();
    expect(reports.length).toBeGreaterThan(1);
    expect(reports[0].updatedAt >= reports[1].updatedAt).toBe(true);
  });

  test("creates and updates a report, tidying recipients", () => {
    const store = createReportStore(() => NOW);
    const created = store.save(null, input, admin, ctx);
    expect(created).toMatchObject({ ownerId: "u_david", recipients: ["ops@northwind.co"] });
    store.save(created.id, { ...input, name: "Spend check v2" }, admin, ctx);
    expect(store.get(created.id)?.name).toBe("Spend check v2");
  });

  test("refuses invalid reports with every problem", () => {
    expect(() => createReportStore(() => NOW).save(null, { ...input, name: "", recipients: [] }, admin, ctx)).toThrow("Name the report. Add at least one recipient.");
  });

  test("only the owner or an admin changes or deletes a report", () => {
    const store = createReportStore(() => NOW);
    const mine = store.save(null, input, admin, ctx);
    expect(() => store.save(mine.id, input, member, ctx)).toThrow("Only its owner or an admin can change this report.");
    expect(() => store.remove(mine.id, member)).toThrow("Only its owner or an admin can change this report.");
    store.remove(mine.id, admin);
    expect(store.get(mine.id)).toBeNull();
  });
});
