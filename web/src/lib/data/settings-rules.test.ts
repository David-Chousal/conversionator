import { describe, expect, test } from "vitest";
import { validateProfile, validateWorkspaceInput } from "./settings-rules";

describe("validateProfile", () => {
  test("accepts a name and a preset range", () => {
    expect(validateProfile({ name: "David Chousal", defaultRangeDays: 30 })).toEqual({});
  });

  test("asks for a name and keeps it short", () => {
    expect(validateProfile({ name: "   ", defaultRangeDays: 30 }).name).toBe("Enter your name.");
    expect(validateProfile({ name: "x".repeat(81), defaultRangeDays: 30 }).name).toBe("Keep your name under 80 characters.");
  });

  test("rejects a range that isn't a preset", () => {
    expect(validateProfile({ name: "Dee", defaultRangeDays: 12 as never }).defaultRangeDays).toBe("Pick 7, 30 or 90 days.");
  });
});

describe("validateWorkspaceInput", () => {
  const good = { name: "Northwind", currency: "USD", timeZone: "America/Los_Angeles", weekStart: "monday" as const };

  test("accepts a known currency, time zone and week start", () => {
    expect(validateWorkspaceInput(good)).toEqual({});
  });

  test("names each problem", () => {
    expect(validateWorkspaceInput({ ...good, name: "" }).name).toBe("Enter a workspace name.");
    expect(validateWorkspaceInput({ ...good, currency: "XYZ" }).currency).toBe("Pick a currency from the list.");
    expect(validateWorkspaceInput({ ...good, timeZone: "Mars/Olympus" }).timeZone).toBe("Pick a time zone from the list.");
    expect(validateWorkspaceInput({ ...good, weekStart: "friday" as never }).weekStart).toBe("Weeks start on Monday or Sunday.");
  });
});
