import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { fixtureReport } from "@/lib/analytics/fixtures";
import { Readout } from "../Readout";
import { ReturnLedger } from "../ReturnLedger";
import { DrillProvider } from "./DrillProvider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const report = fixtureReport();

describe("DrillProvider", () => {
  test("opens the drawer from a readout and returns focus when it closes", () => {
    render(
      <DrillProvider report={report}>
        <Readout data={report.readouts.find((r) => r.key === "roas")!} currency="USD" windowDays={30} scope="CH·ALL" drill />
      </DrillProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Open ROAS breakdown" });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole("complementary", { name: "ROAS breakdown" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Close breakdown" }));
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test("opens a channel's campaigns from a ledger row", () => {
    render(
      <DrillProvider report={report}>
        <ReturnLedger rows={report.ledger} currency="USD" rangeLabel="Mar 1 → Mar 30" revenueLabel="HubSpot closed-won revenue" drill />
      </DrillProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open Meta Ads ROAS breakdown" }));
    expect(screen.getByText("Meta Ads", { selector: "[aria-current]" })).toBeDefined();
  });

  test("renders readouts without a trigger outside a provider", () => {
    render(<Readout data={report.readouts[0]} currency="USD" windowDays={30} scope="CH·ALL" drill />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
