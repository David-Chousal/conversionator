import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { buildConnectionRows } from "@/lib/data/connections-view";
import { createMockStore } from "@/lib/data/mock-store";
import { disconnectAction } from "@/app/(app)/connections/actions";
import { ConnectionsBoard } from "./ConnectionsBoard";

vi.mock("@/app/(app)/connections/actions", () => ({
  syncNowAction: vi.fn(),
  disconnectAction: vi.fn(async () => ({ ok: true, data: null })),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }) }));

const NOW = Date.parse("2026-03-30T17:00:00Z");
const rows = buildConnectionRows(createMockStore(() => NOW, { revoked: ["linkedin-ads"] }).listConnections(), NOW);

describe("ConnectionsBoard", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function renderBoard(canManage = true) {
    render(<Toaster><ConnectionsBoard connected={rows.connected} available={rows.available} canManage={canManage} /></Toaster>);
  }

  test("lists connected and available platforms in separate sections", () => {
    renderBoard();
    expect(screen.getByRole("heading", { name: "Connected" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "Available" })).toBeDefined();
  });

  test("disconnects only after holding the key in the confirmation dialog", async () => {
    renderBoard();
    fireEvent.click(screen.getByRole("button", { name: "Google Ads actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Disconnect" }));
    const dialog = screen.getByRole("dialog", { name: "Disconnect Google Ads?" });
    expect(dialog.textContent).toContain("4 datasets");

    fireEvent.pointerDown(screen.getByRole("button", { name: "Hold to disconnect Google Ads" }));
    await act(async () => vi.advanceTimersByTime(950));

    expect(disconnectAction).toHaveBeenCalledWith("con_google-ads");
    expect(screen.getByRole("status").textContent).toContain("Disconnected Google Ads");
  });

  test("points to Settings for the CRM, which isn't an ad platform", () => {
    renderBoard();
    expect(screen.getByRole("link", { name: /Settings › CRM/ }).getAttribute("href")).toBe("/settings?tab=crm");
  });

  test("tells members who can manage connections", () => {
    renderBoard(false);
    expect(screen.getByText(/Only admins can connect/)).toBeDefined();
  });
});
