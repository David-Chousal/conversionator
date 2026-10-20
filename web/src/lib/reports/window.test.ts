import { describe, expect, test } from "vitest";
import { nextSend, resolveWindow, scheduleLabel, windowLabel } from "./window";

const TODAY = "2026-10-18"; // a Sunday

describe("report windows", () => {
  test("resolves rolling, last-month and custom windows", () => {
    expect(resolveWindow({ kind: "rolling", days: 7 }, TODAY)).toEqual({ from: "2026-10-12", to: TODAY });
    expect(resolveWindow({ kind: "last-month" }, TODAY)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(resolveWindow({ kind: "last-month" }, "2026-01-05")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
    expect(resolveWindow({ kind: "custom", from: "2026-10-01", to: "2026-10-05" }, TODAY)).toEqual({ from: "2026-10-01", to: "2026-10-05" });
  });

  test("labels windows", () => {
    expect(windowLabel({ kind: "rolling", days: 90 })).toBe("Last 90 days");
    expect(windowLabel({ kind: "last-month" })).toBe("Last month");
    expect(windowLabel({ kind: "custom", from: "2026-10-01", to: "2026-10-05" })).toBe("Oct 1 → Oct 5");
  });
});

describe("schedules", () => {
  test("labels the send time from the week start", () => {
    expect(scheduleLabel("weekly", "monday")).toBe("Weekly · Mondays 8:00");
    expect(scheduleLabel("weekly", "sunday")).toBe("Weekly · Sundays 8:00");
    expect(scheduleLabel("monthly", "monday")).toBe("Monthly · 1st 8:00");
    expect(scheduleLabel("none", "monday")).toBeNull();
  });

  test("finds the next send day after today", () => {
    expect(nextSend("weekly", "monday", TODAY)).toBe("2026-10-19");
    expect(nextSend("weekly", "sunday", TODAY)).toBe("2026-10-25");
    expect(nextSend("monthly", "monday", TODAY)).toBe("2026-11-01");
    expect(nextSend("monthly", "monday", "2026-12-31")).toBe("2027-01-01");
    expect(nextSend("none", "monday", TODAY)).toBeNull();
  });
});
