import { connection } from "next/server";
import { syncTiming } from "./auto-sync";
import { crmSignal } from "./crm-view";
import { dataSource } from "./index";
import { NOTIFICATION_CHANNELS } from "./settings-store";
import { alertFeed, alertRows, parseSettingsTab, type AlertRow, type FeedEntry, type SettingsTab } from "./settings-view";
import type { AlertSeries, NotificationPrefs, Preferences } from "./settings-types";
import type { Signal } from "./sync";
import type { CrmConnection, User, Workspace } from "./types";

type Query = Record<string, string | string[] | undefined>;

export interface SettingsPageData {
  tab: SettingsTab;
  user: User;
  canManage: boolean;
  preferences: Preferences;
  workspace: Workspace;
  notifications: NotificationPrefs;
  notificationChannels: typeof NOTIFICATION_CHANNELS;
  alerts: AlertRow[];
  feed: FeedEntry[];
  series: AlertSeries;
  crm: CrmConnection;
  crmSignal: Signal;
  crmTiming: string | null;
}

/** Everything Settings shows, and whether the viewer may change workspace-level parts. Request time only. */
export async function loadSettingsPage(query: Query): Promise<SettingsPageData> {
  await connection();
  const [user, preferences, workspace, notifications, rules, series, crm] = await Promise.all([
    dataSource.getCurrentUser(), dataSource.getPreferences(), dataSource.getWorkspace(), dataSource.getNotifications(),
    dataSource.listAlerts(), dataSource.getAlertSeries(), dataSource.getCrm(),
  ]);
  return {
    tab: parseSettingsTab(query), user, canManage: user.role === "admin", preferences, workspace, notifications,
    notificationChannels: NOTIFICATION_CHANNELS,
    alerts: alertRows(rules, user, series), feed: alertFeed(rules, series), series,
    crm, crmSignal: crmSignal(crm, Date.now()), crmTiming: syncTiming(crm.lastSyncedAt, crm.nextSyncAt, Date.now()),
  };
}
