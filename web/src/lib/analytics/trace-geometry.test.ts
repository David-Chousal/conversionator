import { describe, expect, test } from "vitest";
import { nudgeLabels, traceGeometry } from "./trace-geometry";

describe("nudgeLabels", () => {
  test("leaves labels that are already far enough apart", () => {
    expect(nudgeLabels([20, 80, 140], 28, 0, 200)).toEqual([20, 80, 140]);
  });

  test("pushes crowded labels apart by the minimum gap, keeping order", () => {
    const ys = nudgeLabels([100, 105, 110], 28, 0, 200);
    expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(28);
    expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(28);
  });

  test("keeps labels inside the drawing", () => {
    const ys = nudgeLabels([195, 198, 199], 28, 0, 200);
    expect(Math.max(...ys)).toBeLessThanOrEqual(200);
  });

  test("returns labels in their original order even when input is unsorted", () => {
    const ys = nudgeLabels([150, 20, 152], 28, 0, 200);
    expect(ys[1]).toBe(20);
    expect(Math.abs(ys[2] - ys[0])).toBeGreaterThanOrEqual(28);
  });
});

describe("traceGeometry", () => {
  const geometry = traceGeometry({ seriesValues: [[100, 300, 3050], [50, null, 1700]], width: 640, height: 200 });

  test("starts the y axis at zero with round ticks covering the data", () => {
    expect(geometry.ticks[0]).toBe(0);
    expect(geometry.ticks.at(-1)).toBeGreaterThanOrEqual(3050);
  });

  test("places the first and last points at the plot edges", () => {
    expect(geometry.x(0)).toBe(geometry.plot.left);
    expect(geometry.x(2)).toBe(geometry.plot.right);
  });

  test("breaks a line where a value is missing", () => {
    expect(geometry.paths[1].split("M").filter(Boolean)).toHaveLength(2);
  });

  test("ends each label at the series' last known value", () => {
    expect(geometry.endpoints[1]).toMatchObject({ index: 2, value: 1700 });
  });
});
