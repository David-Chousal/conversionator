import { addDays, formatDay, type IsoDate } from "@/lib/analytics/dates";
import { evaluateAlert } from "./alert-evaluate";
import { canManageAlert } from "./alert-rules";
import { alertSentence, firingHeadline } from "./alert-text";
import type { AlertActor, AlertRule, AlertSeries } from "./settings-types";
import { shortName } from "./team-view";

export const SETTINGS_TABS = ["general", "alerts", "notifications", "workspace", "crm"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

const BACKTEST_DAYS = 30;
const FEED_DAYS = 14;
const FEED_LIMIT = 8;
const CRM_RETURNS = ["connected", "reconnected", "failed", "cancelled"];

type Query = Record<string, string | string[] | undefined>;

export function parseSettingsTab(query: Query): SettingsTab {
  const tab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  if (SETTINGS_TABS.includes(tab as SettingsTab)) return tab as SettingsTab;
  return CRM_RETURNS.some((key) => query[key] === "hubspot") ? "crm" : "general";
}

/** "Yesterday", "Today" or "Oct 14". */
function dayLabel(date: IsoDate, today: IsoDate): string {
  if (date === today) return "Today";
  return date === addDays(today, -1) ? "Yesterday" : formatDay(date);
}

export interface AlertRow {
  id: string;
  rule: AlertRule;
  sentence: string;
  owner: string;
  fired: string;
  canManage: boolean;
}

export function alertRows(rules: AlertRule[], actor: AlertActor, series: AlertSeries): AlertRow[] {
  return rules.map((rule) => {
    const firings = rule.paused ? [] : evaluateAlert(rule, series.days, series.today, BACKTEST_DAYS);
    const fired = rule.paused ? "Paused" : firings.length === 0 ? `Hasn't fired in ${BACKTEST_DAYS} days` : `Fired ${firings.length}× · last ${formatDay(firings[0].date)}`;
    return {
      id: rule.id, rule, fired,
      sentence: alertSentence(rule, series),
      owner: rule.scope === "workspace" ? `Workspace · ${shortName(rule.ownerName)}` : "Personal",
      canManage: canManageAlert(rule, actor),
    };
  });
}

export interface FeedEntry {
  id: string;
  ruleId: string;
  when: string;
  headline: string;
}

/** What active rules caught in the last two weeks, newest first. */
export function alertFeed(rules: AlertRule[], series: AlertSeries): FeedEntry[] {
  return rules
    .filter((rule) => !rule.paused)
    .flatMap((rule) => evaluateAlert(rule, series.days, series.today, FEED_DAYS).map((firing) => ({ rule, firing })))
    .sort((a, b) => b.firing.date.localeCompare(a.firing.date))
    .slice(0, FEED_LIMIT)
    .map(({ rule, firing }) => ({
      id: `${rule.id}:${firing.date}`, ruleId: rule.id,
      when: dayLabel(firing.date, series.today),
      headline: firingHeadline(rule, firing, series),
    }));
}
