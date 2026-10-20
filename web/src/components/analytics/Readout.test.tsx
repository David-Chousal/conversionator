import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Readout } from "./Readout";

describe("Readout", () => {
  test("shows the label, value, change and comparison period", () => {
    render(<Readout data={{ key: "cpa", value: 18.62, previous: 20.72, range: { min: 16.9, max: 24.3 }, source: "platform", sourceLabel: "Platform-reported" }} currency="USD" windowDays={30} scope="CH·ALL" />);
    expect(screen.getByText("CPA")).toBeDefined();
    expect(screen.getByText("$18").textContent).toBe("$18.62");
    expect(screen.getByText("−$2.10")).toBeDefined();
    expect(screen.getByText("vs prev 30d")).toBeDefined();
  });

  test("describes the 90-day range for screen readers", () => {
    render(<Readout data={{ key: "spend", value: 48210, previous: 42890, range: { min: 38900, max: 51700 }, source: "crm", sourceLabel: null }} currency="USD" windowDays={30} scope="CH·ALL" />);
    expect(screen.getByRole("img", { name: /90-day range \$38\.9k to \$51\.7k/ })).toBeDefined();
  });

  test("marks a good change with the positive tone", () => {
    const { container } = render(<Readout data={{ key: "roas", value: 4.1, previous: 3.5, range: null, source: "crm", sourceLabel: "HubSpot" }} currency="USD" windowDays={30} scope="CH·ALL" />);
    expect(container.querySelector(".cor-slope--good")).not.toBeNull();
  });

  test("labels where conversion-based numbers come from", () => {
    render(<Readout data={{ key: "cpa", value: 18.62, previous: null, range: null, source: "platform", sourceLabel: "Platform-reported" }} currency="USD" windowDays={30} scope="CH·ALL" />);
    expect(screen.getByText("Platform-reported").className).toContain("cor-badge");
  });

  test("says when there is no earlier period to compare", () => {
    render(<Readout data={{ key: "spend", value: 500, previous: null, range: null, source: "crm", sourceLabel: null }} currency="USD" windowDays={7} scope="CH·ALL" />);
    expect(screen.getByText("No earlier data to compare")).toBeDefined();
  });
});
