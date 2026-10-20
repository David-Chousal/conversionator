import { describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { buildConnectionRows } from "@/lib/data/connections-view";
import { createMockStore, FIRST_SYNC_MS } from "@/lib/data/mock-store";
import { ConnectionRow } from "./ConnectionRow";

vi.mock("@/app/(app)/connections/actions", () => ({ syncNowAction: vi.fn(), disconnectAction: vi.fn() }));

const NOW = Date.parse("2026-03-30T17:00:00Z");

function rowsAt(now: number, mutate?: (store: ReturnType<typeof createMockStore>) => void) {
  let clock = NOW;
  const store = createMockStore(() => clock, { revoked: ["linkedin-ads"] });
  mutate?.(store);
  clock = now;
  return buildConnectionRows(store.listConnections(), now);
}

function renderRow(row: ReturnType<typeof rowsAt>["connected"][number], canManage = true) {
  render(<Toaster><ConnectionRow row={row} canManage={canManage} onDisconnect={vi.fn()} /></Toaster>);
}

describe("ConnectionRow", () => {
  const rows = rowsAt(NOW);

  test("a healthy connection offers Sync now and shows its signal", () => {
    renderRow(rows.connected[0]);
    expect(screen.getByRole("button", { name: /Sync now/ })).toBeDefined();
    expect(screen.getByText("Synced")).toBeDefined();
    expect(screen.getByText("4 of 6")).toBeDefined();
  });

  test("a failed connection makes Reconnect the primary action with the reason", () => {
    renderRow(rows.connected[2]);
    const reconnect = screen.getByRole("link", { name: "Reconnect" });
    expect(reconnect.className).toContain("cor-key--primary");
    expect(reconnect.getAttribute("href")).toBe("/oauth/linkedin-ads?mode=reconnect&connection=con_linkedin-ads");
    expect(screen.getByText(/revoked COR's access/)).toBeDefined();
  });

  test("a stale connection offers Sync now, never Reconnect: automatic syncs keep retrying", () => {
    const stale = { ...rows.connected[1], signal: { state: "stale" as const, lit: 2, word: "Stale", age: "3h" } };
    renderRow(stale);
    expect(screen.getByRole("button", { name: /Sync now/ })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Reconnect" })).toBeNull();
  });

  test("says it syncs on its own and when the next run is", () => {
    renderRow(rows.connected[0]);
    expect(screen.getByText("Auto · next in 56m")).toBeDefined();
  });

  test("a first sync shows progress in rows instead of a signal", () => {
    const syncing = rowsAt(NOW + FIRST_SYNC_MS / 2, (store) => store.connect("tiktok-ads"));
    renderRow(syncing.connected[3]);
    expect(screen.getByRole("progressbar", { name: "First sync of TikTok Ads" }).getAttribute("aria-valuenow")).toBe("50");
    expect(screen.getByRole("button", { name: "Syncing…" }).hasAttribute("disabled")).toBe(true);
  });

  test("an available platform links to its sign-in", () => {
    renderRow(rows.available[0]);
    expect(screen.getByRole("link", { name: /Connect/ }).getAttribute("href")).toBe("/oauth/tiktok-ads?mode=connect");
    expect(screen.getByText("Not connected")).toBeDefined();
  });

  test("members see the row without actions", () => {
    renderRow(rows.connected[0], false);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
