import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttributionBay } from "./AttributionBay";
import type { Attribution } from "@/lib/analytics/types";

const crm: Attribution = {
  source: "crm", crmName: "HubSpot", leadStage: "mql", crmStatus: "connected",
  attributed: { leads: 412, deals: 96, revenue: 41000 }, unattributed: { leads: 178, deals: 30, revenue: 9000 },
};

describe("AttributionBay", () => {
  test("says how many CRM leads were matched to an ad", () => {
    render(<AttributionBay attribution={crm} />);
    expect(screen.getByText(/HubSpot matched 412 of 590 leads \(70%\) to an ad/)).toBeDefined();
    expect(screen.getByText(/Last ad interaction · leads counted at marketing qualified lead/i)).toBeDefined();
  });

  test("links to the attribution settings", () => {
    render(<AttributionBay attribution={crm} />);
    expect(screen.getByRole("link", { name: /Attribution settings/ }).getAttribute("href")).toBe("/settings?tab=crm");
  });

  test("warns when HubSpot has stopped syncing", () => {
    render(<AttributionBay attribution={{ ...crm, crmStatus: "failed" }} />);
    expect(screen.getByText(/HubSpot stopped syncing/)).toBeDefined();
  });

  test("explains platform-reported numbers and offers to connect a CRM", () => {
    render(<AttributionBay attribution={{ source: "platform", crmName: null, leadStage: null, crmStatus: "available", attributed: crm.attributed, unattributed: crm.unattributed }} />);
    expect(screen.getByText(/platform-reported/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /Connect HubSpot/ }).getAttribute("href")).toBe("/settings?tab=crm");
  });

  test("says when HubSpot's first sync is still running", () => {
    render(<AttributionBay attribution={{ source: "platform", crmName: null, leadStage: null, crmStatus: "syncing", attributed: crm.attributed, unattributed: crm.unattributed }} />);
    expect(screen.getByText(/HubSpot is on its first sync/)).toBeDefined();
  });
});
