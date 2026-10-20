import { addDays, type IsoDate } from "@/lib/analytics/dates";
import { EMPTY_TOTALS, addTotals, metricValue } from "@/lib/analytics/metrics";
import type { Totals } from "@/lib/analytics/types";
import type { AlertDay, AlertFiring, AlertRule } from "./settings-types";

const PERIOD_DAYS = { day: 1, week: 7 } as const;
const hasData = (totals: Totals) => totals.spend > 0 || totals.impressions > 0;

function totalsByDate(rule: AlertRule, days: AlertDay[]): Map<IsoDate, Totals> {
  const byDate = new Map<IsoDate, Totals>();
  for (const day of days) {
    if (rule.platform !== "all" && day.platform !== rule.platform) continue;
    byDate.set(day.date, addTotals(byDate.get(day.date) ?? EMPTY_TOTALS, day.totals));
  }
  return byDate;
}

/** The metric over the period ending on `end`; null when any day in it has no data. */
function periodValue(rule: AlertRule, byDate: Map<IsoDate, Totals>, end: IsoDate): number | null {
  let totals = EMPTY_TOTALS;
  for (let offset = 0; offset < PERIOD_DAYS[rule.period]; offset += 1) {
    const day = byDate.get(addDays(end, -offset));
    if (!day || !hasData(day)) return null;
    totals = addTotals(totals, day);
  }
  return metricValue(rule.metric, totals);
}

function check(rule: AlertRule, byDate: Map<IsoDate, Totals>, date: IsoDate): Omit<AlertFiring, "ruleId" | "date"> | null {
  const value = periodValue(rule, byDate, date);
  if (value === null) return null;
  if (rule.condition === "above") return value > rule.threshold ? { value, previous: null } : null;
  if (rule.condition === "below") return value < rule.threshold ? { value, previous: null } : null;
  const previous = periodValue(rule, byDate, addDays(date, -PERIOD_DAYS[rule.period]));
  if (!previous) return null;
  return Math.abs((value - previous) / previous) * 100 > rule.threshold ? { value, previous } : null;
}

/** When the rule would have fired in the last `windowDays`, newest first. It fires as the condition starts, not every day it holds. */
export function evaluateAlert(rule: AlertRule, days: AlertDay[], today: IsoDate, windowDays: number): AlertFiring[] {
  const byDate = totalsByDate(rule, days);
  const firings: AlertFiring[] = [];
  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const hit = check(rule, byDate, date);
    if (hit && !check(rule, byDate, addDays(date, -1))) firings.push({ ruleId: rule.id, date, ...hit });
  }
  return firings.reverse();
}
