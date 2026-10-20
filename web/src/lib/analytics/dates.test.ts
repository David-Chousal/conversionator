import { describe, expect, test } from "vitest";
import { addDays, dayCount, formatDay, formatRange, todayIn } from "./dates";

describe("dates", () => {
  test("finds today in the workspace time zone", () => {
    expect(todayIn("America/Los_Angeles", Date.parse("2026-03-31T05:00:00Z"))).toBe("2026-03-30");
  });

  test("adds and subtracts days across month ends", () => {
    expect(addDays("2026-02-27", 3)).toBe("2026-03-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  test("counts days inclusively", () => {
    expect(dayCount("2026-03-01", "2026-03-30")).toBe(30);
  });

  test("formats a day as month and date", () => {
    expect(formatDay("2026-03-01")).toBe("Mar 1");
  });

  test("formats a range with an arrow, adding years only when needed", () => {
    expect(formatRange("2026-03-01", "2026-03-30", "2026-03-30")).toBe("Mar 1 → Mar 30");
    expect(formatRange("2025-12-20", "2026-01-10", "2026-03-30")).toBe("Dec 20, 2025 → Jan 10, 2026");
  });
});
