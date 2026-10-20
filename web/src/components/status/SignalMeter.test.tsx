import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignalMeter } from "./SignalMeter";

describe("SignalMeter", () => {
  test("shows the state word and age", () => {
    render(<SignalMeter state="stale" lit={2} word="Stale" age="6h" />);
    expect(screen.getByText("Stale")).toBeDefined();
    expect(screen.getByText("6h")).toBeDefined();
  });

  test("lights exactly the given number of bars", () => {
    const { container } = render(<SignalMeter state="ok" lit={3} word="Synced" />);
    expect(container.querySelectorAll(".cor-signal__bars i:not(.off)")).toHaveLength(3);
  });
});
