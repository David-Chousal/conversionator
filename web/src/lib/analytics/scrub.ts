import { addDays, dayCount, type IsoDate } from "./dates";

export interface DateWindow {
  from: IsoDate;
  to: IsoDate;
}

/** The day under a horizontal position, given as a 0–1 fraction of the track. */
export function dayAtPosition(fraction: number, days: IsoDate[]): IsoDate {
  const clamped = Math.min(1, Math.max(0, fraction));
  return days[Math.round(clamped * (days.length - 1))];
}

/** Slides the window by whole days, keeping its length and staying inside the available days. */
export function moveWindow(window: DateWindow, deltaDays: number, days: IsoDate[]): DateWindow {
  const length = dayCount(window.from, window.to);
  const first = days[0];
  const lastStart = addDays(days[days.length - 1], -(length - 1));
  let from = addDays(window.from, deltaDays);
  if (from < first) from = first;
  if (from > lastStart) from = lastStart;
  return { from, to: addDays(from, length - 1) };
}

/** Moves one end of the window to `day`, never crossing the other end or leaving the track. */
export function resizeWindow(window: DateWindow, end: "from" | "to", day: IsoDate, days: IsoDate[]): DateWindow {
  const first = days[0];
  const last = days[days.length - 1];
  if (end === "from") {
    const from = day < first ? first : day > window.to ? window.to : day;
    return { from, to: window.to };
  }
  const to = day > last ? last : day < window.from ? window.from : day;
  return { from: window.from, to };
}
