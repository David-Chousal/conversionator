import { describe, expect, test } from "vitest";
import { addBay, bayKey, isOnBoard, moveBay, removeBay, resizeBay, resolveBays, stepSpan, systemDefault, validateLayout } from "./layout";
import type { BayConfig } from "./layout";

const crmDefault = systemDefault("crm");

describe("systemDefault", () => {
  test("lays out readouts, trace, ledger, share and campaigns, with CRM metrics", () => {
    expect(crmDefault.map((bay) => [bay.kind, bay.metric ?? null, bay.span])).toEqual([
      ["readout", "spend", 3], ["readout", "leads", 3], ["readout", "cpl", 3], ["readout", "roas", 3],
      ["trace", null, 12], ["ledger", null, 6], ["share", null, 6], ["campaigns", null, 12],
    ]);
  });

  test("uses platform-reported metrics without a CRM", () => {
    expect(systemDefault("platform").slice(0, 4).map((bay) => bay.metric)).toEqual(["spend", "conversions", "cpa", "roas"]);
  });
});

describe("resolveBays", () => {
  test("uses the system default when a view has no saved layout", () => {
    expect(resolveBays({ id: "default", name: "Default", bays: null }, "crm")).toEqual(crmDefault);
  });

  test("uses a view's own layout when it has one", () => {
    const bays: BayConfig[] = [{ id: "t", kind: "trace", span: 6 }];
    expect(resolveBays({ id: "v", name: "Growth", bays }, "crm")).toBe(bays);
  });
});

describe("editing", () => {
  test("moves a bay to a new position", () => {
    const moved = moveBay(crmDefault, 4, 0);
    expect(moved[0].kind).toBe("trace");
    expect(moved).toHaveLength(crmDefault.length);
  });

  test("ignores moves outside the list", () => {
    expect(moveBay(crmDefault, 0, 99)).toEqual(moveBay(crmDefault, 0, crmDefault.length - 1));
  });

  test("snaps a resize to the nearest width the bay allows", () => {
    const trace = crmDefault[4];
    expect(resizeBay(crmDefault, trace.id, 7)[4].span).toBe(6);
    expect(resizeBay(crmDefault, trace.id, 11)[4].span).toBe(12);
  });

  test("steps through allowed widths with the keyboard", () => {
    expect(stepSpan("readout", 3, 1)).toBe(4);
    expect(stepSpan("readout", 6, 1)).toBe(6);
    expect(stepSpan("campaigns", 12, -1)).toBe(12);
  });

  test("adds a bay at the top with its default width and a unique id", () => {
    const added = addBay(crmDefault, "share");
    expect(added[0]).toMatchObject({ kind: "share", span: 6 });
    expect(new Set(added.map((bay) => bay.id)).size).toBe(added.length);
  });

  test("adds a readout for a chosen metric", () => {
    expect(addBay([], "readout", "conversions")[0]).toMatchObject({ kind: "readout", metric: "conversions", span: 3 });
  });

  test("removes a bay", () => {
    expect(removeBay(crmDefault, crmDefault[0].id)).toHaveLength(crmDefault.length - 1);
  });

  test("knows which bays are already on the board", () => {
    expect(isOnBoard(crmDefault, "trace")).toBe(true);
    expect(isOnBoard(crmDefault, "readout", "conversions")).toBe(false);
    expect(bayKey({ kind: "readout", metric: "roas" })).toBe("readout:roas");
  });

  test("never changes the list it was given", () => {
    const before = JSON.stringify(crmDefault);
    moveBay(crmDefault, 0, 3);
    resizeBay(crmDefault, crmDefault[0].id, 6);
    removeBay(crmDefault, crmDefault[0].id);
    expect(JSON.stringify(crmDefault)).toBe(before);
  });
});

describe("validateLayout", () => {
  test("accepts a well-formed layout", () => {
    expect(validateLayout(crmDefault)).toEqual(crmDefault);
  });

  test("rejects unknown kinds, widths a bay can't take, bad metrics and duplicates", () => {
    expect(() => validateLayout([{ id: "x", kind: "pie", span: 6 }])).toThrow(/kind/);
    expect(() => validateLayout([{ id: "x", kind: "campaigns", span: 6 }])).toThrow(/width/);
    expect(() => validateLayout([{ id: "x", kind: "readout", span: 3, metric: "vibes" }])).toThrow(/metric/);
    expect(() => validateLayout([{ id: "a", kind: "trace", span: 12 }, { id: "b", kind: "trace", span: 6 }])).toThrow(/twice/);
  });

  test("rejects layouts that aren't lists or are too long", () => {
    expect(() => validateLayout("nope")).toThrow();
    expect(() => validateLayout(Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, kind: "readout", span: 3, metric: "spend" })))).toThrow();
  });
});
