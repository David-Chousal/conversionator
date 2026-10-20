import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { fixtureReport } from "@/lib/analytics/fixtures";
import type { DrillTarget } from "@/lib/analytics/drilldown";
import { DrillDrawer } from "./DrillDrawer";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const report = fixtureReport();

function renderDrawer(target: DrillTarget) {
  const onNavigate = vi.fn();
  const onClose = vi.fn();
  render(<DrillDrawer report={report} target={target} onNavigate={onNavigate} onClose={onClose} />);
  return { onNavigate, onClose, drawer: screen.getByRole("complementary") };
}

describe("DrillDrawer", () => {
  test("is named after the metric and shows its scoped readout", () => {
    const { drawer } = renderDrawer({ metric: "roas", platform: null, campaignId: null, bucket: null });
    expect(drawer.getAttribute("aria-label")).toBe("ROAS breakdown");
    expect(within(drawer).getByRole("heading", { name: "ROAS breakdown" })).toBeDefined();
  });

  test("drills into a channel from its row", () => {
    const { onNavigate } = renderDrawer({ metric: "roas", platform: null, campaignId: null, bucket: null });
    fireEvent.click(screen.getByRole("button", { name: "Show Google Ads campaigns" }));
    expect(onNavigate).toHaveBeenCalledWith({ metric: "roas", platform: "google-ads", campaignId: null, bucket: null });
  });

  test("goes back up with the All channels breadcrumb", () => {
    const { onNavigate } = renderDrawer({ metric: "roas", platform: "google-ads", campaignId: null, bucket: null });
    fireEvent.click(screen.getByRole("button", { name: "All channels" }));
    expect(onNavigate).toHaveBeenCalledWith({ metric: "roas", platform: null, campaignId: null, bucket: null });
  });

  test("drills from a campaign into its ads", () => {
    const { onNavigate } = renderDrawer({ metric: "roas", platform: "google-ads", campaignId: null, bucket: null });
    fireEvent.click(screen.getByRole("button", { name: "Show Brand search ads" }));
    expect(onNavigate).toHaveBeenCalledWith({ metric: "roas", platform: "google-ads", campaignId: "google-brand", bucket: null });
  });

  test("filters the board to the campaign whose ads are shown", () => {
    replace.mockClear();
    const { onClose } = renderDrawer({ metric: "spend", platform: "google-ads", campaignId: "google-brand", bucket: null });
    fireEvent.click(screen.getByRole("button", { name: "Filter the board to Brand search" }));
    expect(replace).toHaveBeenCalledWith("/analytics?campaign=google-brand", { scroll: false });
    expect(onClose).toHaveBeenCalled();
  });

  test("totals the rows in the footer", () => {
    renderDrawer({ metric: "roas", platform: null, campaignId: null, bucket: null });
    expect(screen.getByText("3 channels")).toBeDefined();
  });

  test("closes on Escape", () => {
    const { onClose } = renderDrawer({ metric: "roas", platform: null, campaignId: null, bucket: null });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
