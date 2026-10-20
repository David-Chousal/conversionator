import { describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { updateLeadStageAction } from "@/app/(app)/settings/actions";
import { CrmPanel } from "./CrmPanel";
import type { Signal } from "@/lib/data/sync";
import type { CrmConnection } from "@/lib/data/types";

vi.mock("@/app/(app)/settings/actions", () => ({
  syncCrmAction: vi.fn(),
  disconnectCrmAction: vi.fn(),
  updateLeadStageAction: vi.fn(async () => ({ ok: true, data: null })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));

const crm: CrmConnection = {
  provider: "hubspot", name: "HubSpot", account: "Portal 7731902", status: "connected", lastSyncedAt: "2026-03-30T16:48:00Z", nextSyncAt: "2026-03-30T17:48:00Z",
  leadStage: "mql", dealStage: "closed-won", attributionModel: "last-ad-interaction", records: { contacts: 18240, deals: 1310 },
};
const ok: Signal = { state: "ok", lit: 4, word: "Synced", age: "12m" };

function renderPanel(overrides: Partial<CrmConnection> = {}, canManage = true, signal: Signal = ok) {
  render(<Toaster><CrmPanel crm={{ ...crm, ...overrides }} signal={signal} canManage={canManage} /></Toaster>);
}

describe("CrmPanel", () => {
  test("shows a connected HubSpot with its records and sync action", () => {
    renderPanel();
    expect(screen.getByText(/18,240 contacts · 1,310 deals/)).toBeDefined();
    expect(screen.getByRole("button", { name: /Sync now/ })).toBeDefined();
  });

  test("states how attribution works", () => {
    renderPanel();
    expect(screen.getByDisplayValue("Last ad interaction")).toBeDefined();
    expect(screen.getByDisplayValue("Deal stage · Closed won")).toBeDefined();
  });

  test("changes the lifecycle stage that counts as a lead", async () => {
    renderPanel();
    fireEvent.change(screen.getByLabelText("Count a lead at"), { target: { value: "sql" } });
    expect(updateLeadStageAction).toHaveBeenCalledWith("sql");
  });

  test("offers to connect when HubSpot isn't connected", () => {
    renderPanel({ status: "available", lastSyncedAt: null, records: { contacts: 0, deals: 0 } }, true, { state: "off", lit: 0, word: "Not connected" });
    expect(screen.getByRole("link", { name: /Connect HubSpot/ }).getAttribute("href")).toBe("/oauth/hubspot?mode=connect");
    expect(screen.queryByLabelText("Count a lead at")).toBeNull();
  });

  test("makes Reconnect the primary action when syncing failed", () => {
    renderPanel({ status: "failed", failureReason: "HubSpot revoked COR's access." }, true, { state: "failed", lit: 0, word: "Failed" });
    const reconnect = screen.getByRole("link", { name: "Reconnect" });
    expect(reconnect.className).toContain("cor-key--primary");
    expect(reconnect.getAttribute("href")).toBe("/oauth/hubspot?mode=reconnect");
  });

  test("shows members the settings read-only", () => {
    renderPanel({}, false);
    expect(screen.queryByRole("button", { name: /Sync now/ })).toBeNull();
    expect((screen.getByLabelText("Count a lead at") as HTMLSelectElement).disabled).toBe(true);
    expect(screen.getByText(/Only admins can change/)).toBeDefined();
  });
});
