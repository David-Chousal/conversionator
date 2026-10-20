import { describe, expect, test } from "vitest";
import { parseReportInput } from "./parse";

describe("parseReportInput", () => {
  test("keeps known values and drops the rest", () => {
    expect(parseReportInput({ name: "R", metrics: ["spend", "vibes", "spend"], platforms: ["meta-ads", "myspace"], window: { kind: "custom", from: "2026-10-01", to: "nope" }, compare: "yes", format: "docx", schedule: "daily", recipients: ["a@x.co", 4] }))
      .toEqual({ name: "R", metrics: ["spend"], platforms: ["meta-ads"], window: { kind: "custom", from: "2026-10-01", to: "" }, compare: false, format: "pdf", schedule: "none", recipients: ["a@x.co"] });
  });

  test("survives garbage with a safe default window", () => {
    expect(parseReportInput(null).window).toEqual({ kind: "rolling", days: 30 });
  });
});
