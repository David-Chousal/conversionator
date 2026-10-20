import { describe, expect, test } from "vitest";
import { dayAtPosition, moveWindow, resizeWindow } from "./scrub";

const DAYS = Array.from({ length: 10 }, (_, i) => `2026-03-${String(21 + i).padStart(2, "0")}`);

describe("dayAtPosition", () => {
  test("maps a horizontal fraction to the nearest day", () => {
    expect(dayAtPosition(0, DAYS)).toBe("2026-03-21");
    expect(dayAtPosition(1, DAYS)).toBe("2026-03-30");
    expect(dayAtPosition(4 / 9, DAYS)).toBe("2026-03-25");
  });

  test("clamps positions outside the track", () => {
    expect(dayAtPosition(-0.2, DAYS)).toBe("2026-03-21");
    expect(dayAtPosition(1.4, DAYS)).toBe("2026-03-30");
  });
});

describe("moveWindow", () => {
  test("shifts both ends by the same number of days", () => {
    expect(moveWindow({ from: "2026-03-23", to: "2026-03-25" }, 2, DAYS)).toEqual({ from: "2026-03-25", to: "2026-03-27" });
  });

  test("stops at the edges without changing the length", () => {
    expect(moveWindow({ from: "2026-03-23", to: "2026-03-25" }, 10, DAYS)).toEqual({ from: "2026-03-28", to: "2026-03-30" });
    expect(moveWindow({ from: "2026-03-23", to: "2026-03-25" }, -10, DAYS)).toEqual({ from: "2026-03-21", to: "2026-03-23" });
  });
});

describe("resizeWindow", () => {
  test("moves one end and keeps at least one day", () => {
    expect(resizeWindow({ from: "2026-03-23", to: "2026-03-25" }, "from", "2026-03-22", DAYS)).toEqual({ from: "2026-03-22", to: "2026-03-25" });
    expect(resizeWindow({ from: "2026-03-23", to: "2026-03-25" }, "to", "2026-03-20", DAYS)).toEqual({ from: "2026-03-23", to: "2026-03-23" });
  });
});
