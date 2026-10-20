import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Toaster, useToast } from "./Toaster";
import type { ToastInput } from "./Toaster";

function Trigger({ toast }: { toast: ToastInput }) {
  const { show } = useToast();
  return <button type="button" onClick={() => show(toast)}>Go</button>;
}

function setup(toast: ToastInput) {
  render(<Toaster><Trigger toast={toast} /></Toaster>);
  fireEvent.click(screen.getByRole("button", { name: "Go" }));
}

describe("Toaster", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("shows a success toast as a status message", () => {
    setup({ tone: "ok", title: "Synced 4,120 rows from Google Ads" });
    expect(screen.getByRole("status").textContent).toContain("Synced 4,120 rows from Google Ads");
  });

  test("dismisses success toasts after five seconds", () => {
    setup({ tone: "ok", title: "Synced" });
    act(() => vi.advanceTimersByTime(5100));
    expect(screen.queryByText("Synced")).toBeNull();
  });

  test("still dismisses when the page re-renders while the toast is up", () => {
    const { rerender } = render(<Toaster><Trigger toast={{ tone: "ok", title: "Connected" }} /></Toaster>);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    for (let second = 0; second < 5; second += 1) {
      act(() => vi.advanceTimersByTime(1000));
      rerender(<Toaster><Trigger toast={{ tone: "ok", title: "Connected" }} /></Toaster>);
    }
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText("Connected")).toBeNull();
  });

  test("keeps failures until dismissed", () => {
    setup({ tone: "failed", title: "Sync failed" });
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("alert").textContent).toContain("Sync failed");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
