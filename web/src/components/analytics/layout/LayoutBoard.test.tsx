import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { createViewAction, saveViewAction } from "@/app/(app)/analytics/actions";
import { PLATFORM_ATTRIBUTION, fixtureReport } from "@/lib/analytics/fixtures";
import type { SavedView } from "@/lib/analytics/layout";
import { LayoutBoard } from "./LayoutBoard";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("@/app/(app)/analytics/actions", () => ({
  saveViewAction: vi.fn(async (id: string, bays: unknown) => ({ ok: true, data: { id, name: "Default", bays } })),
  createViewAction: vi.fn(async (name: string, bays: unknown) => ({ ok: true, data: { id: "growth", name, bays } })),
  deleteViewAction: vi.fn(async () => ({ ok: true, data: null })),
}));

const report = fixtureReport();
const VIEWS: SavedView[] = [
  { id: "default", name: "Default", bays: null },
  { id: "growth", name: "Growth", bays: [{ id: "trace", kind: "trace", span: 12 }, { id: "readout-roas", kind: "readout", span: 3, metric: "roas" }] },
];

function renderBoard(activeViewId = "default", reportOverride = report, views = VIEWS) {
  return render(<Toaster><LayoutBoard report={reportOverride} views={views} activeViewId={activeViewId} /></Toaster>);
}

const slotNames = () => [...document.querySelectorAll("[data-bay-id]")].map((slot) => slot.getAttribute("data-bay-id"));
const customize = () => fireEvent.click(screen.getByRole("button", { name: /Customize/ }));

describe("LayoutBoard", () => {
  beforeEach(() => {
    replace.mockClear();
    vi.mocked(saveViewAction).mockClear();
    vi.mocked(createViewAction).mockClear();
  });

  test("shows the default layout and the saved views", () => {
    renderBoard();
    expect(slotNames()).toEqual(["readout-spend", "readout-leads", "readout-cpl", "readout-roas", "trace", "ledger", "share", "campaigns"]);
    expect(screen.getByRole("tab", { name: "Default" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "Growth" })).toBeDefined();
  });

  test("shows a saved view's own layout", () => {
    renderBoard("growth");
    expect(slotNames()).toEqual(["trace", "readout-roas"]);
  });

  test("Customize shows the edit bar and the bay library", () => {
    renderBoard();
    customize();
    expect(screen.getByText("Editing layout · Default")).toBeDefined();
    expect(screen.getByRole("complementary", { name: "Add a bay" })).toBeDefined();
  });

  test("removing a bay is undone by Cancel", () => {
    renderBoard();
    customize();
    fireEvent.click(screen.getByRole("button", { name: "Remove Share of spend" }));
    expect(slotNames()).not.toContain("share");
    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(slotNames()).toContain("share");
    expect(screen.queryByText(/Editing layout/)).toBeNull();
  });

  test("moves a bay with the keyboard and announces it", () => {
    renderBoard();
    customize();
    const grip = screen.getByRole("button", { name: "Move Spend by channel" });
    fireEvent.keyDown(grip, { key: " " });
    fireEvent.keyDown(grip, { key: "ArrowLeft" });
    fireEvent.keyDown(grip, { key: "ArrowLeft" });
    fireEvent.keyDown(grip, { key: " " });
    expect(slotNames().indexOf("trace")).toBe(2);
    expect(screen.getByText(/Spend by channel dropped at position 3 of 8/)).toBeDefined();
  });

  test("Escape while moving puts the bay back", () => {
    renderBoard();
    customize();
    const grip = screen.getByRole("button", { name: "Move Spend by channel" });
    fireEvent.keyDown(grip, { key: "Enter" });
    fireEvent.keyDown(grip, { key: "ArrowRight" });
    fireEvent.keyDown(grip, { key: "Escape" });
    expect(slotNames().indexOf("trace")).toBe(4);
    expect(screen.getByText("Editing layout · Default")).toBeDefined();
  });

  test("resizes a bay through its allowed widths", () => {
    renderBoard();
    customize();
    const width = screen.getByRole("slider", { name: "Width of Spend by channel" });
    fireEvent.keyDown(width, { key: "ArrowLeft" });
    expect(width.getAttribute("aria-valuetext")).toBe("6 of 12 columns");
    expect(within(screen.getByTestId("slot-trace")).getByText("6 / 12")).toBeDefined();
  });

  test("adds a bay from the library at the top", () => {
    renderBoard();
    customize();
    fireEvent.click(screen.getByRole("button", { name: "Add Deals won readout" }));
    expect(slotNames()[0]).toBe("readout-conversions");
    expect((screen.getByRole("button", { name: "Add Spend by channel" }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("saves the edited layout", async () => {
    renderBoard();
    customize();
    fireEvent.click(screen.getByRole("button", { name: "Remove Campaigns" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Save view/ })));
    const [id, bays] = vi.mocked(saveViewAction).mock.calls[0];
    expect(id).toBe("default");
    expect((bays ?? []).map((bay) => bay.id)).not.toContain("campaigns");
    expect(screen.getByRole("status").textContent).toContain("Saved Default");
  });

  test("saving the Default view unchanged keeps it on the system layout", async () => {
    renderBoard();
    customize();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Save view/ })));
    expect(vi.mocked(saveViewAction).mock.calls[0]).toEqual(["default", null]);
  });

  test("Reset to default asks once, then restores the system layout", () => {
    renderBoard("growth");
    customize();
    fireEvent.click(screen.getByRole("button", { name: "Reset to default" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Reset Growth to the default layout?" })).getByRole("button", { name: "Reset layout" }));
    expect(slotNames()).toHaveLength(8);
  });

  test("switches views through the URL", () => {
    renderBoard();
    fireEvent.click(screen.getByRole("tab", { name: "Growth" }));
    expect(replace).toHaveBeenCalledWith("/analytics?view=growth", { scroll: false });
  });

  test("creates a new view from the current layout", async () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: "+ New view" }));
    fireEvent.change(screen.getByLabelText("View name"), { target: { value: "Growth 2" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Create view" })));
    expect(vi.mocked(createViewAction).mock.calls[0][0]).toBe("Growth 2");
    expect(replace).toHaveBeenCalledWith("/analytics?view=growth", { scroll: false });
  });

  test("E enters Customize and Escape leaves it", () => {
    renderBoard();
    fireEvent.keyDown(document.body, { key: "e" });
    expect(screen.getByText("Editing layout · Default")).toBeDefined();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(screen.queryByText(/Editing layout/)).toBeNull();
  });

  test("explains a CRM-only readout when no CRM is connected", () => {
    const views: SavedView[] = [{ id: "default", name: "Default", bays: [{ id: "readout-leads", kind: "readout", span: 3, metric: "leads" }] }];
    renderBoard("default", fixtureReport({}, PLATFORM_ATTRIBUTION), views);
    expect(screen.getByText(/Leads come from your CRM/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Connect HubSpot" }).getAttribute("href")).toBe("/settings?tab=crm");
  });
});
