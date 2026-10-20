import { describe, expect, test } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  test("joins headers and rows with CRLF", () => {
    expect(toCsv(["Campaign", "Spend"], [["Brand search", "4210"]])).toBe("Campaign,Spend\r\nBrand search,4210\r\n");
  });

  test("quotes cells with commas, quotes or line breaks", () => {
    expect(toCsv(["Name"], [['Spring, "sale"'], ["two\nlines"]])).toBe('Name\r\n"Spring, ""sale"""\r\n"two\nlines"\r\n');
  });

  test("neutralises cells that a spreadsheet would run as formulas", () => {
    expect(toCsv(["Name"], [["=HYPERLINK(1)"]])).toBe("Name\r\n'=HYPERLINK(1)\r\n");
  });
});
