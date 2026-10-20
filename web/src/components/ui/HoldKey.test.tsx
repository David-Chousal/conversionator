import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { HoldKey } from "./HoldKey";

describe("HoldKey", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const onConfirm = vi.fn();
    render(<HoldKey label="Hold to disconnect" holdLabel="Hold to disconnect Meta Ads" onConfirm={onConfirm} />);
    return { onConfirm, key: screen.getByRole("button", { name: "Hold to disconnect Meta Ads" }) };
  }

  test("confirms after being held for the full duration", () => {
    const { onConfirm, key } = setup();
    fireEvent.pointerDown(key);
    act(() => vi.advanceTimersByTime(950));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("does nothing when released early", () => {
    const { onConfirm, key } = setup();
    fireEvent.pointerDown(key);
    act(() => vi.advanceTimersByTime(400));
    fireEvent.pointerUp(key);
    act(() => vi.advanceTimersByTime(1000));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  test("works by holding Space", () => {
    const { onConfirm, key } = setup();
    fireEvent.keyDown(key, { key: " " });
    act(() => vi.advanceTimersByTime(950));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("shows progress while held", () => {
    const { key } = setup();
    fireEvent.pointerDown(key);
    act(() => vi.advanceTimersByTime(450));
    const held = parseFloat(key.style.getPropertyValue("--held"));
    expect(held).toBeGreaterThan(40);
    expect(held).toBeLessThan(60);
  });
});
