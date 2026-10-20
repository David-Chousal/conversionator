import { describe, expect, test } from "vitest";
import { formatAge } from "./format";

const MINUTE = 60_000;

describe("formatAge", () => {
  test("says now for under a minute", () => {
    expect(formatAge(30_000)).toBe("now");
  });

  test("uses minutes under an hour", () => {
    expect(formatAge(4 * MINUTE)).toBe("4m");
  });

  test("uses hours under a day", () => {
    expect(formatAge(6 * 60 * MINUTE)).toBe("6h");
  });

  test("uses days from 24 hours", () => {
    expect(formatAge(3 * 24 * 60 * MINUTE)).toBe("3d");
  });
});
