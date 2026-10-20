import { scaleLinear } from "d3-scale";
import { line } from "d3-shape";

export interface Plot {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Endpoint {
  index: number;
  value: number;
  x: number;
  y: number;
}

export interface TraceGeometry {
  plot: Plot;
  x: (index: number) => number;
  y: (value: number) => number;
  ticks: number[];
  paths: string[];
  endpoints: (Endpoint | null)[];
}

interface GeometryInput {
  seriesValues: (number | null)[][];
  width: number;
  height: number;
}

// Room for y labels on the left, direct labels on the right, flags above and dates below.
const MARGIN = { left: 48, right: 136, top: 24, bottom: 28 };
const TICK_COUNT = 4;

/** Scales, line paths and endpoints for a multi-series line chart starting at zero. */
export function traceGeometry({ seriesValues, width, height }: GeometryInput): TraceGeometry {
  const plot = { left: MARGIN.left, right: width - MARGIN.right, top: MARGIN.top, bottom: height - MARGIN.bottom };
  const count = Math.max(1, ...seriesValues.map((values) => values.length));
  const max = Math.max(0, ...seriesValues.flat().filter((value): value is number => value !== null));
  const x = scaleLinear().domain([0, Math.max(1, count - 1)]).range([plot.left, plot.right]);
  const y = scaleLinear().domain([0, max || 1]).nice(TICK_COUNT).range([plot.bottom, plot.top]);
  const draw = line<number | null>()
    .defined((value) => value !== null)
    .x((_, index) => x(index))
    .y((value) => y(value ?? 0));

  return {
    plot,
    x: (index) => x(index),
    y: (value) => y(value),
    ticks: y.ticks(TICK_COUNT),
    paths: seriesValues.map((values) => draw(values) ?? ""),
    endpoints: seriesValues.map((values) => {
      const index = values.map((value) => value !== null).lastIndexOf(true);
      if (index < 0) return null;
      const value = values[index] as number;
      return { index, value, x: x(index), y: y(value) };
    }),
  };
}

/** Spreads label positions at least `gap` apart inside [top, bottom], keeping their order. */
export function nudgeLabels(ys: number[], gap: number, top: number, bottom: number): number[] {
  const order = ys.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  const placed = order.map(({ y }) => y);
  for (let i = 0; i < placed.length; i += 1) placed[i] = Math.max(placed[i], i === 0 ? top : placed[i - 1] + gap);
  for (let i = placed.length - 1; i >= 0; i -= 1) placed[i] = Math.min(placed[i], i === placed.length - 1 ? bottom : placed[i + 1] - gap);
  for (let i = 0; i < placed.length; i += 1) placed[i] = Math.max(placed[i], top);
  const result = new Array<number>(ys.length);
  order.forEach(({ index }, i) => {
    result[index] = placed[i];
  });
  return result;
}
