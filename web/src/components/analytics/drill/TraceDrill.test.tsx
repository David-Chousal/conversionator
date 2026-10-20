import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { fixtureReport } from "@/lib/analytics/fixtures";
import { TracePanel } from "../TracePanel";
import { DrillProvider } from "./DrillProvider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));

const report = fixtureReport();

describe("chart drill-down", () => {
  test("Enter on the crosshair opens that week's spend breakdown", () => {
    render(<DrillProvider report={report}><TracePanel trace={report.trace} currency="USD" rangeLabel="Mar 1 → Mar 30" /></DrillProvider>);
    const chart = screen.getByRole("img", { name: /Weekly spend/ });
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    fireEvent.keyDown(chart, { key: "Enter" });
    expect(screen.getByRole("complementary", { name: "Ad spend breakdown" }).textContent).toContain("Wk of Mar 24 · Mar 24 → Mar 30");
  });

  test("tells keyboard users how to open a breakdown", () => {
    render(<DrillProvider report={report}><TracePanel trace={report.trace} currency="USD" rangeLabel="Mar 1 → Mar 30" /></DrillProvider>);
    expect(screen.getByRole("img", { name: /press Enter to see the campaigns behind it/ })).toBeDefined();
  });
});
