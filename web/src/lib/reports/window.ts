import { addDays, formatDay, weekday, type IsoDate } from "@/lib/analytics/dates";
import type { WeekStart } from "@/lib/data/settings-types";
import type { ReportSchedule, ReportWindow } from "./types";

const pad = (value: number) => String(value).padStart(2, "0");
const firstOfMonth = (year: number, month: number): IsoDate => {
  const date = new Date(Date.UTC(year, month, 1));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-01`;
};

export function resolveWindow(window: ReportWindow, today: IsoDate): { from: IsoDate; to: IsoDate } {
  if (window.kind === "custom") return { from: window.from, to: window.to };
  if (window.kind === "rolling") return { from: addDays(today, -(window.days - 1)), to: today };
  const [year, month] = today.split("-").map(Number);
  const thisMonth = firstOfMonth(year, month - 1);
  return { from: firstOfMonth(year, month - 2), to: addDays(thisMonth, -1) };
}

export function windowLabel(window: ReportWindow): string {
  if (window.kind === "rolling") return `Last ${window.days} days`;
  if (window.kind === "last-month") return "Last month";
  return `${formatDay(window.from)} → ${formatDay(window.to)}`;
}

const DAY_NAMES: Record<WeekStart, string> = { monday: "Mondays", sunday: "Sundays" };

/** "Weekly · Mondays 8:00", in the workspace's time zone; null when not scheduled. */
export function scheduleLabel(schedule: ReportSchedule, weekStart: WeekStart): string | null {
  if (schedule === "weekly") return `Weekly · ${DAY_NAMES[weekStart]} 8:00`;
  return schedule === "monthly" ? "Monthly · 1st 8:00" : null;
}

/** The next day the report goes out, after today. */
export function nextSend(schedule: ReportSchedule, weekStart: WeekStart, today: IsoDate): IsoDate | null {
  if (schedule === "none") return null;
  if (schedule === "monthly") {
    const [year, month] = today.split("-").map(Number);
    return firstOfMonth(year, month);
  }
  const target = weekStart === "monday" ? 0 : 6;
  const ahead = (target - weekday(today) + 7) % 7 || 7;
  return addDays(today, ahead);
}
