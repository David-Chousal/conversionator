import { describe, expect, test } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { CampaignTable } from "./CampaignTable";
import type { CampaignRow } from "@/lib/analytics/types";

function campaign(id: string, spend: number, revenue: number): CampaignRow {
  return { id, name: id, platform: "google-ads", channelCode: "CH·01", colorIndex: 1, spend, revenue, conversions: 10, clicks: 100, impressions: 5000, leads: 40 };
}

const many = Array.from({ length: 30 }, (_, i) => campaign(`Campaign ${i + 1}`, 1000 - i * 10, 2000 + i * 100));
const totals = { spend: 1, revenue: 1, conversions: 1, clicks: 1, impressions: 1, leads: 1 };

describe("CampaignTable", () => {
  test("sorts by spend, largest first, by default", () => {
    render(<CampaignTable rows={many} totals={totals} currency="USD" source="crm" />);
    const first = screen.getAllByRole("row")[1];
    expect(within(first).getByText("Campaign 1")).toBeDefined();
    expect(screen.getByRole("columnheader", { name: /Spend/ }).getAttribute("aria-sort")).toBe("descending");
  });

  test("shows HubSpot's leads and deals with a CRM", () => {
    render(<CampaignTable rows={many} totals={totals} currency="USD" source="crm" />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.replace(/ [▲▼]$/, ""));
    expect(headers).toEqual(["Campaign", "Spend", "Impr.", "CTR", "CPC", "Leads", "CPL", "Deals", "ROAS"]);
  });

  test("shows platform-reported conversions without a CRM, and says so", () => {
    render(<CampaignTable rows={many} totals={totals} currency="USD" source="platform" />);
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.replace(/ [▲▼]$/, ""));
    expect(headers).toEqual(["Campaign", "Spend", "Impr.", "CTR", "CPC", "Conv.", "CPA", "ROAS"]);
    expect(screen.getByText(/platform-reported/i)).toBeDefined();
  });

  test("re-sorts when a column header is clicked", () => {
    render(<CampaignTable rows={many} totals={totals} currency="USD" source="crm" />);
    fireEvent.click(screen.getByRole("button", { name: /ROAS/ }));
    expect(within(screen.getAllByRole("row")[1]).getByText("Campaign 30")).toBeDefined();
  });

  test("pages 25 rows at a time", () => {
    render(<CampaignTable rows={many} totals={totals} currency="USD" source="crm" />);
    expect(screen.getByText("Rows 1–25 of 30")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Rows 26–30 of 30")).toBeDefined();
  });
});
