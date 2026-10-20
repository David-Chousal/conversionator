import { describe, expect, test } from "vitest";
import { formatChange, formatCompactCount, formatMoney, formatRate, formatRoas } from "./format";

describe("formatMoney", () => {
  test("drops cents from amounts of $100 or more", () => {
    expect(formatMoney(48210.4)).toBe("$48,210");
  });

  test("keeps cents below $100", () => {
    expect(formatMoney(18.624)).toBe("$18.62");
  });

  test("always keeps cents when asked (CPA, CPC)", () => {
    expect(formatMoney(120.5, { cents: true })).toBe("$120.50");
  });

  test("compacts thousands and millions to one decimal", () => {
    expect(formatMoney(21400, { compact: true })).toBe("$21.4k");
    expect(formatMoney(1_240_000, { compact: true })).toBe("$1.2M");
    expect(formatMoney(840, { compact: true })).toBe("$840");
  });

  test("uses a true minus for negatives", () => {
    expect(formatMoney(-2.1)).toBe("−$2.10");
  });

  test("uses the workspace currency symbol", () => {
    expect(formatMoney(310, { currency: "EUR" })).toBe("€310");
  });
});

describe("formatChange", () => {
  test("signs percentage changes with one decimal", () => {
    expect(formatChange(0.1243, "percent")).toBe("+12.4%");
    expect(formatChange(-0.03, "percent")).toBe("−3.0%");
  });

  test("formats money changes with a sign", () => {
    expect(formatChange(-2.1, "money")).toBe("−$2.10");
  });

  test("formats ROAS changes as multiples", () => {
    expect(formatChange(0.6, "roas")).toBe("+0.6");
  });

  test("formats count changes with grouping", () => {
    expect(formatChange(1204, "count")).toBe("+1,204");
  });
});

describe("other formats", () => {
  test("formats ROAS with one decimal and ×", () => {
    expect(formatRoas(4.087)).toBe("4.1×");
  });

  test("formats small rates with two decimals", () => {
    expect(formatRate(0.02414)).toBe("2.41%");
  });

  test("compacts counts only past a million", () => {
    expect(formatCompactCount(18404)).toBe("18,404");
    expect(formatCompactCount(2_310_000)).toBe("2.31M");
  });
});
