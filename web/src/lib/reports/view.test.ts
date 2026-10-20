import { describe, expect, test } from "vitest";
import type { Report } from "./types";
import { reportRows } from "./view";

const report: Report = { id: "r", name: "Monthly performance", metrics: ["spend", "leads", "roas"], platforms: ["google-ads", "linkedin-ads"], window: { kind: "last-month" }, compare: true, format: "pdf", schedule: "monthly", recipients: ["a@x.co", "b@x.co"], ownerId: "u_dakota", ownerName: "Dakota Goldstein", createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-10-15T00:00:00Z" };
const ctx = { today: "2026-10-18", weekStart: "monday" as const, available: ["google-ads" as const], actor: { id: "u_troy", role: "member" as const } };

describe("reportRows", () => {
  test("describes contents, schedule and the next send", () => {
    const [row] = reportRows([report], ctx);
    expect(row).toMatchObject({ id: "r", name: "Monthly performance", contents: "3 metrics · Google Ads, LinkedIn Ads · Last month", schedule: "Monthly · 1st 8:00", next: "Next Nov 1 · 2 recipients", format: "PDF", owner: "Dakota G.", canEdit: false });
  });

  test("flags channels that are no longer connected", () => {
    expect(reportRows([report], ctx)[0].issue).toBe("LinkedIn Ads isn't connected anymore.");
  });

  test("one-off reports say so", () => {
    const [row] = reportRows([{ ...report, schedule: "none", recipients: [], platforms: ["google-ads"] }], { ...ctx, actor: { id: "u_dakota", role: "member" } });
    expect(row).toMatchObject({ schedule: null, next: "Not scheduled", issue: null, canEdit: true });
  });
});
