import { describe, expect, test } from "vitest";
import { readoutView } from "./readout-view";

describe("readoutView", () => {
  test("shows spend as a flat percent change", () => {
    const view = readoutView({ key: "spend", value: 48210, previous: 42890, range: { min: 38900, max: 51700 }, source: "crm", sourceLabel: null }, "USD");
    expect(view).toMatchObject({ label: "Ad spend", main: "$48,210", small: "", change: "+12.4%", tone: "flat", rangeMin: "$38.9k", rangeMax: "$51.7k" });
    expect(view.nowPercent).toBeCloseTo(72.7, 0);
    expect(view.previousPercent).toBeCloseTo(31.1, 0);
  });

  test("treats a falling CPA as good and keeps cents small", () => {
    const view = readoutView({ key: "cpa", value: 18.62, previous: 20.72, range: { min: 16.9, max: 24.3 }, source: "platform", sourceLabel: "Platform-reported" }, "USD");
    expect(view).toMatchObject({ main: "$18", small: ".62", change: "−$2.10", tone: "good" });
  });

  test("treats a falling ROAS as bad", () => {
    expect(readoutView({ key: "roas", value: 3.5, previous: 4.1, range: null, source: "crm", sourceLabel: "HubSpot" }, "USD")).toMatchObject({ main: "3.5", small: "×", change: "−0.6", tone: "bad" });
  });

  test("tilts the slope with the size of the change, capped at 45 degrees", () => {
    expect(readoutView({ key: "conversions", value: 300, previous: 100, range: null, source: "platform", sourceLabel: "Platform-reported" }, "USD").slopeDegrees).toBe(45);
    expect(readoutView({ key: "conversions", value: 100, previous: 100, range: null, source: "platform", sourceLabel: "Platform-reported" }, "USD").slopeDegrees).toBe(0);
  });

  test("says when there is nothing to compare with", () => {
    expect(readoutView({ key: "spend", value: 500, previous: null, range: null, source: "crm", sourceLabel: null }, "USD")).toMatchObject({ change: null, tone: "flat" });
  });

  test("names CRM metrics by what HubSpot counts", () => {
    expect(readoutView({ key: "conversions", value: 40, previous: null, range: null, source: "crm", sourceLabel: "HubSpot" }, "USD").label).toBe("Deals won");
    expect(readoutView({ key: "cpa", value: 40, previous: null, range: null, source: "crm", sourceLabel: "HubSpot" }, "USD").label).toBe("Cost per deal");
  });

  test("formats leads as a count and cost per lead with cents", () => {
    expect(readoutView({ key: "leads", value: 1204, previous: 1000, range: null, source: "crm", sourceLabel: "HubSpot" }, "USD")).toMatchObject({ label: "Leads", main: "1,204", tone: "good" });
    expect(readoutView({ key: "cpl", value: 41.5, previous: 45, range: null, source: "crm", sourceLabel: "HubSpot" }, "USD")).toMatchObject({ label: "Cost per lead", main: "$41", small: ".50", tone: "good" });
  });

  test("shows a dash when the metric can't be computed", () => {
    expect(readoutView({ key: "cpa", value: null, previous: null, range: null, source: "crm", sourceLabel: "HubSpot" }, "USD").main).toBe("—");
  });
});
