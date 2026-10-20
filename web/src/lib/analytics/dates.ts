/** Calendar dates as "YYYY-MM-DD" strings, interpreted in the workspace time zone. */
export type IsoDate = string;

const DAY_MS = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toUtc = (date: IsoDate) => Date.parse(`${date}T00:00:00Z`);
const fromUtc = (time: number): IsoDate => new Date(time).toISOString().slice(0, 10);

export function todayIn(timeZone: string, now: number): IsoDate {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtc(toUtc(date) + days * DAY_MS);
}

/** Number of days from `from` to `to`, both included. */
export function dayCount(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS) + 1;
}

/** Day index since the Unix epoch; stable across requests, used to seed mock data. */
export function dayIndex(date: IsoDate): number {
  return Math.round(toUtc(date) / DAY_MS);
}

/** Monday = 0 … Sunday = 6. */
export function weekday(date: IsoDate): number {
  return (new Date(toUtc(date)).getUTCDay() + 6) % 7;
}

export function formatDay(date: IsoDate, withYear = false): string {
  const [year, month, day] = date.split("-").map(Number);
  const base = `${MONTHS[month - 1]} ${day}`;
  return withYear ? `${base}, ${year}` : base;
}

/** "Mar 1 → Mar 30"; years appear only when the range isn't entirely in the current year. */
export function formatRange(from: IsoDate, to: IsoDate, today: IsoDate): string {
  const thisYear = today.slice(0, 4);
  const withYear = from.slice(0, 4) !== thisYear || to.slice(0, 4) !== thisYear;
  return `${formatDay(from, withYear)} → ${formatDay(to, withYear)}`;
}
