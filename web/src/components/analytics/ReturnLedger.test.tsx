import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReturnLedger } from "./ReturnLedger";

const rows = [
  { platform: "google-ads" as const, name: "Google Ads", colorIndex: 1, spend: 21400, revenue: 96300 },
  { platform: "linkedin-ads" as const, name: "LinkedIn Ads", colorIndex: 3, spend: 3300, revenue: 29400 },
];

describe("ReturnLedger", () => {
  test("lists each channel with its ROAS and highlights the best", () => {
    render(<ReturnLedger rows={rows} currency="USD" rangeLabel="Mar 1 → Mar 30" revenueLabel="HubSpot closed-won revenue" />);
    expect(screen.getByText("4.5×")).toBeDefined();
    expect(screen.getByText("8.9×").className).toContain("is-best");
  });

  test("draws spend and return on one dollar scale", () => {
    const { container } = render(<ReturnLedger rows={rows} currency="USD" rangeLabel="Mar 1 → Mar 30" revenueLabel="HubSpot closed-won revenue" />);
    const width = (selector: string) => parseFloat((container.querySelector(selector) as HTMLElement).style.getPropertyValue("--w"));
    const spendTrack = 1.6;
    const returnTrack = 4;
    const ratio = (width(".cor-ledger__ret") * returnTrack) / (width(".cor-ledger__spend") * spendTrack);
    expect(ratio).toBeCloseTo(96300 / 21400, 1);
  });

  test("puts every cell of a row in its own grid column", () => {
    const { container } = render(<ReturnLedger rows={rows} currency="USD" rangeLabel="Mar 1 → Mar 30" revenueLabel="HubSpot closed-won revenue" />);
    const cells = [...container.querySelectorAll(".cor-ledger > [role=row]")].map((row) => row.children.length);
    expect(cells).toEqual([4, 4, 4]);
    expect(container.querySelector(".cor-ledger .cor-visually-hidden")).toBeNull();
  });

  test("says where the revenue comes from", () => {
    render(<ReturnLedger rows={rows} currency="USD" rangeLabel="Mar 1 → Mar 30" revenueLabel="Platform-reported conversion value" />);
    expect(screen.getByText(/Platform-reported conversion value/)).toBeDefined();
  });

  test("sums spend, return and overall ROAS", () => {
    render(<ReturnLedger rows={rows} currency="USD" rangeLabel="Mar 1 → Mar 30" revenueLabel="HubSpot closed-won revenue" />);
    expect(screen.getByText(/spent \$24\.7k · returned \$125\.7k · 5\.1×/i)).toBeDefined();
  });
});
