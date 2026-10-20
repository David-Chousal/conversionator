import { describe, expect, test } from "vitest";
import { DATASETS, datasetInfo, defaultEnabled } from "./datasets";

describe("dataset catalog", () => {
  test("keeps each ad platform's dataset counts and defaults", () => {
    const counts = Object.fromEntries(Object.entries(DATASETS).map(([kind, list]) => [kind, `${defaultEnabled(kind as never).length} of ${list.length}`]));
    expect(counts).toEqual({
      "google-ads": "4 of 6", "meta-ads": "3 of 5", "linkedin-ads": "2 of 4", "tiktok-ads": "3 of 4", "microsoft-ads": "3 of 4", hubspot: "3 of 3",
    });
  });

  test("every ad platform pulls campaigns and spend by day by default", () => {
    for (const kind of ["google-ads", "meta-ads", "linkedin-ads", "tiktok-ads", "microsoft-ads"] as const) {
      expect(defaultEnabled(kind)).toEqual(expect.arrayContaining(["campaigns", "spend-daily"]));
    }
  });

  test("locks HubSpot's contacts and deals on, with the reason", () => {
    expect(datasetInfo("hubspot", "contacts").required).toMatch(/attribution/i);
    expect(datasetInfo("hubspot", "deals").required).toMatch(/attribution/i);
    expect(datasetInfo("hubspot", "lifecycle-stages").required).toBeUndefined();
  });

  test("describes each dataset's columns", () => {
    expect(datasetInfo("google-ads", "spend-daily").columns.map((column) => column.label)).toEqual(["Date", "Spend", "Impressions", "Clicks"]);
  });

  test("errors for an unknown dataset", () => {
    expect(() => datasetInfo("google-ads", "nope")).toThrow();
  });
});
