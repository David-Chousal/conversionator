import { describe, expect, test } from "vitest";
import { activePreset, analyticsHref, filterToQuery, parseFilter } from "./filter";

const TODAY = "2026-03-30";
const PLATFORMS = ["google-ads", "meta-ads"] as const;
const CAMPAIGNS = ["google-brand"];

describe("parseFilter", () => {
  test("defaults to the last 30 days, all channels", () => {
    expect(parseFilter({}, TODAY, [...PLATFORMS], CAMPAIGNS)).toEqual({ from: "2026-03-01", to: TODAY, excluded: [], campaignId: null });
  });

  test("uses the person's default range when the URL has no window", () => {
    expect(parseFilter({}, TODAY, [...PLATFORMS], CAMPAIGNS, 7)).toMatchObject({ from: "2026-03-24", to: TODAY });
    expect(parseFilter({ from: "bad", to: "x" }, TODAY, [...PLATFORMS], CAMPAIGNS, 90).from).toBe("2025-12-31");
  });

  test("links leave out only the person's own default window", () => {
    const weekly = parseFilter({}, TODAY, [...PLATFORMS], CAMPAIGNS, 7);
    expect(filterToQuery(weekly, TODAY)).toBe("");
    expect(filterToQuery({ ...weekly, from: "2026-03-01" }, TODAY)).toBe("from=2026-03-01&to=2026-03-30");
  });

  test("reads a valid window, muted channels and a campaign", () => {
    const filter = parseFilter({ from: "2026-03-10", to: "2026-03-20", off: "meta-ads", campaign: "google-brand" }, TODAY, [...PLATFORMS], CAMPAIGNS);
    expect(filter).toEqual({ from: "2026-03-10", to: "2026-03-20", excluded: ["meta-ads"], campaignId: "google-brand" });
  });

  test("falls back to the default for malformed or reversed dates", () => {
    expect(parseFilter({ from: "march", to: "2026-03-20" }, TODAY, [...PLATFORMS], CAMPAIGNS).from).toBe("2026-03-01");
    expect(parseFilter({ from: "2026-03-20", to: "2026-03-10" }, TODAY, [...PLATFORMS], CAMPAIGNS).from).toBe("2026-03-01");
  });

  test("never ends in the future or starts before the 180-day history", () => {
    const filter = parseFilter({ from: "2025-01-01", to: "2026-05-01" }, TODAY, [...PLATFORMS], CAMPAIGNS);
    expect(filter).toMatchObject({ from: "2025-10-02", to: TODAY });
  });

  test("ignores unknown channels and campaigns", () => {
    const filter = parseFilter({ off: "myspace,meta-ads", campaign: "nope" }, TODAY, [...PLATFORMS], CAMPAIGNS);
    expect(filter).toMatchObject({ excluded: ["meta-ads"], campaignId: null });
  });
});

describe("filterToQuery", () => {
  test("omits defaults", () => {
    expect(filterToQuery({ from: "2026-03-01", to: TODAY, excluded: [], campaignId: null }, TODAY)).toBe("");
  });

  test("writes only what differs", () => {
    expect(filterToQuery({ from: "2026-03-24", to: TODAY, excluded: ["meta-ads"], campaignId: null }, TODAY)).toBe("from=2026-03-24&to=2026-03-30&off=meta-ads");
  });
});

describe("activePreset", () => {
  test("recognises a preset that ends today", () => {
    expect(activePreset({ from: "2026-03-24", to: TODAY, excluded: [], campaignId: null }, TODAY)).toBe(7);
  });

  test("returns null for a custom window", () => {
    expect(activePreset({ from: "2026-03-10", to: "2026-03-20", excluded: [], campaignId: null }, TODAY)).toBeNull();
  });
});

describe("analyticsHref", () => {
  const filter = { from: "2026-03-01", to: TODAY, excluded: [], campaignId: null };

  test("is the bare page for the default filter and view", () => {
    expect(analyticsHref(filter, TODAY, "default")).toBe("/analytics");
  });

  test("keeps a saved view next to the filter", () => {
    expect(analyticsHref({ ...filter, excluded: ["meta-ads"] }, TODAY, "growth")).toBe("/analytics?off=meta-ads&view=growth");
  });
});
