import type { AlertDraft, AlertRule, AlertSeries, NotificationPrefs, Preferences, ProfileInput, WorkspaceInput } from "./settings-types";
import type { BayConfig, SavedView } from "@/lib/analytics/layout";
import type { AnalyticsFilter, AnalyticsReport, AttributionSource, CampaignInfo } from "@/lib/analytics/types";
import type { Report, ReportContent, ReportContext, ReportInput } from "@/lib/reports/types";
import type { DatasetSummary } from "./datasets";
import type { RecordPage, RecordQuery } from "./mock-records";
import type { Invite, Member } from "./team-types";

/** Ad platforms: where spend happens. CRMs are not platforms; see CrmConnection. */
export type Platform = "google-ads" | "meta-ads" | "linkedin-ads" | "tiktok-ads" | "microsoft-ads";

/** Where a connection stands from the admin's point of view. */
export type ConnectionStatus = "connected" | "failed" | "paused" | "syncing" | "available";

export interface Connection {
  id: string;
  /** Fixed at connection time, e.g. "CH·01"; drives the ch-n series color. */
  channelCode: string;
  platform: Platform;
  name: string;
  account: string;
  status: ConnectionStatus;
  lastSyncedAt: string | null;
  datasets: { enabled: number; total: number };
  failureReason?: string;
  /** When the next automatic sync runs; null when the connection isn't on the schedule (first sync, or needs reconnecting). */
  nextSyncAt: string | null;
  /** Present only while the first sync runs (status "syncing"). */
  syncProgress?: { percent: number; rows: number };
}

export interface SyncResult {
  rows: number;
  finishedAt: string;
}

export type CrmProvider = "hubspot";
export type CrmStatus = "connected" | "failed" | "syncing" | "available";
/** The lifecycle stage at which a CRM contact counts as a lead. */
export type LeadStage = "lead" | "mql" | "sql";
export type AttributionModel = "last-ad-interaction";

/** The CRM that attributes leads, deals and revenue to ad platforms, campaigns and ads. */
export interface CrmConnection {
  provider: CrmProvider;
  name: string;
  account: string;
  status: CrmStatus;
  lastSyncedAt: string | null;
  /** When the next automatic sync runs; null when not on the schedule. */
  nextSyncAt: string | null;
  failureReason?: string;
  syncProgress?: { percent: number; rows: number };
  leadStage: LeadStage;
  dealStage: "closed-won";
  attributionModel: AttributionModel;
  records: { contacts: number; deals: number };
}

export interface CrmSettings {
  leadStage: LeadStage;
}

export type Role = "admin" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
}

export interface Workspace {
  id: string;
  name: string;
  currency: string;
  timeZone: string;
  weekStart: "monday" | "sunday";
}

/** The contract the real API will implement; pages depend only on this. */
export interface CorDataSource {
  getWorkspace(): Promise<Workspace>;
  getCurrentUser(): Promise<User>;
  /** Connected platforms first (by channel code), then platforms available to connect. */
  listConnections(): Promise<Connection[]>;
  /** Called after the platform's own sign-in approves access. */
  connectPlatform(platform: Platform): Promise<Connection>;
  reconnect(connectionId: string): Promise<Connection>;
  /** Removes the connection and deletes the data COR stored from it. */
  disconnect(connectionId: string): Promise<void>;
  syncNow(connectionId: string): Promise<SyncResult>;
  getCrm(): Promise<CrmConnection>;
  /** Called after the CRM's own sign-in approves access. */
  connectCrm(): Promise<CrmConnection>;
  reconnectCrm(): Promise<CrmConnection>;
  /** Removes the CRM and deletes the contacts and deals COR stored from it. */
  disconnectCrm(): Promise<void>;
  syncCrm(): Promise<SyncResult>;
  updateCrmSettings(settings: CrmSettings): Promise<CrmConnection>;
  /** Campaigns across connected platforms, for filters and validation. */
  listCampaigns(): Promise<CampaignInfo[]>;
  /** Everything the Analytics page shows for one filter. */
  getAnalytics(filter: AnalyticsFilter): Promise<AnalyticsReport>;
  /** The current user's saved Analytics views, Default first. */
  listViews(): Promise<SavedView[]>;
  createView(name: string, bays: BayConfig[]): Promise<SavedView>;
  /** Null puts the view back on the system default layout. */
  saveView(id: string, bays: BayConfig[] | null): Promise<SavedView>;
  deleteView(id: string): Promise<void>;
  /** Datasets for an ad connection id or the CRM source id, with stored record counts. */
  listDatasets(sourceId: string): Promise<DatasetSummary[]>;
  setDatasetEnabled(sourceId: string, datasetId: string, enabled: boolean): Promise<void>;
  listRecords(sourceId: string, datasetId: string, query: RecordQuery): Promise<RecordPage>;
  listMembers(): Promise<Member[]>;
  listInvites(): Promise<Invite[]>;
  /** Sends invitations; refuses the whole batch if any address can't be invited. */
  inviteMembers(emails: string[], role: Role): Promise<Invite[]>;
  resendInvite(inviteId: string): Promise<Invite>;
  revokeInvite(inviteId: string): Promise<void>;
  changeRole(memberId: string, role: Role): Promise<Member>;
  /** Removes a member; they lose access immediately. */
  removeMember(memberId: string): Promise<void>;
  /** The current user's personal preferences. */
  getPreferences(): Promise<Preferences>;
  updateProfile(input: ProfileInput): Promise<User>;
  /** Admins only: name, currency, time zone and week start for everyone. */
  updateWorkspace(input: WorkspaceInput): Promise<Workspace>;
  getNotifications(): Promise<NotificationPrefs>;
  updateNotifications(prefs: NotificationPrefs): Promise<NotificationPrefs>;
  /** Workspace alerts plus the current user's personal alerts, newest first. */
  listAlerts(): Promise<AlertRule[]>;
  createAlert(draft: AlertDraft): Promise<AlertRule>;
  updateAlert(alertId: string, draft: AlertDraft): Promise<AlertRule>;
  setAlertPaused(alertId: string, paused: boolean): Promise<void>;
  deleteAlert(alertId: string): Promise<void>;
  /** Recent daily totals per channel, for checking alert rules. */
  getAlertSeries(): Promise<AlertSeries>;
  /** Every report in the workspace, most recently changed first. */
  listReports(): Promise<Report[]>;
  getReport(reportId: string): Promise<Report | null>;
  /** Creates (null id) or updates a report; owners and admins only for updates. */
  saveReport(reportId: string | null, input: ReportInput): Promise<Report>;
  deleteReport(reportId: string): Promise<void>;
  /** Channels a report can include, today, and the attribution source. */
  getReportContext(): Promise<ReportContext & { source: AttributionSource }>;
  /** The report's numbers for its window and channels, as the preview and exports show them. */
  getReportContent(input: ReportInput): Promise<ReportContent>;
}
