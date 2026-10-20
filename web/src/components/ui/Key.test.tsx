import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Key } from "./Key";

describe("Key", () => {
  test("prints its keyboard shortcut", () => {
    render(<Key shortcut="S">Sync now</Key>);
    expect(screen.getByRole("button", { name: /Sync now/ }).querySelector("kbd")?.textContent).toBe("S");
  });

  test("applies the primary variant class", () => {
    render(<Key variant="primary">Connect</Key>);
    expect(screen.getByRole("button").className).toContain("cor-key--primary");
  });

  test("defaults to type button so it never submits a form by accident", () => {
    render(<Key>Cancel</Key>);
    expect(screen.getByRole("button").getAttribute("type")).toBe("button");
  });
});
