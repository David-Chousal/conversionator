import { describe, expect, test } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TracePanel } from "./TracePanel";
import type { Trace } from "@/lib/analytics/types";

const trace: Trace = {
  granularity: "week",
  bucketStarts: ["2026-03-03", "2026-03-10", "2026-03-17", "2026-03-24"],
  bucketEnds: ["2026-03-09", "2026-03-16", "2026-03-23", "2026-03-30"],
  series: [
    { platform: "google-ads", name: "Google Ads", colorIndex: 1, values: [1800, 2100, 2600, 3050], stale: false },
    { platform: "linkedin-ads", name: "LinkedIn Ads", colorIndex: 3, values: [600, 700, 900, null], stale: true, staleAge: "6h" },
  ],
  annotations: [{ date: "2026-03-12", label: "Spring sale · Shopping" }],
  adsByBucket: [{}, {}, {}, {}],
};

describe("TracePanel", () => {
  test("labels each line at its end with name and last value", () => {
    render(<TracePanel trace={trace} currency="USD" rangeLabel="Mar 3 → Mar 30" />);
    expect(screen.getByText("Google Ads")).toBeDefined();
    expect(screen.getByText("$3,050")).toBeDefined();
    expect(screen.getByText("$900")).toBeDefined();
  });

  test("summarises the chart for screen readers", () => {
    render(<TracePanel trace={trace} currency="USD" rangeLabel="Mar 3 → Mar 30" />);
    expect(screen.getByRole("img", { name: /Weekly spend by channel.*Google Ads ends at \$3,050/ })).toBeDefined();
  });

  test("warns about stale channels and draws them dotted", () => {
    const { container } = render(<TracePanel trace={trace} currency="USD" rangeLabel="Mar 3 → Mar 30" />);
    expect(screen.getByText(/LinkedIn Ads is 6h behind/)).toBeDefined();
    expect(container.querySelectorAll('path[stroke-dasharray="1 4"]')).toHaveLength(1);
  });

  test("says a channel stopped syncing when it has no age", () => {
    const failed = { ...trace, series: [trace.series[0], { ...trace.series[1], staleAge: undefined }] };
    render(<TracePanel trace={failed} currency="USD" rangeLabel="Mar 3 → Mar 30" />);
    expect(screen.getByText("LinkedIn Ads stopped syncing.")).toBeDefined();
  });

  test("flags campaign launches", () => {
    render(<TracePanel trace={trace} currency="USD" rangeLabel="Mar 3 → Mar 30" />);
    expect(screen.getByText("SPRING SALE · SHOPPING")).toBeDefined();
  });

  test("steps a crosshair with the arrow keys and shows the total", () => {
    render(<TracePanel trace={trace} currency="USD" rangeLabel="Mar 3 → Mar 30" />);
    const chart = screen.getByRole("img", { name: /Weekly spend/ });
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    expect(screen.getByText("WK OF MAR 24 · $3,050")).toBeDefined();
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    expect(screen.getByText("WK OF MAR 17 · $3,500")).toBeDefined();
  });
});
