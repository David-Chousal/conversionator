import { attributionContext, mockAlertSeries, mockAnalytics, mockCampaigns } from "./mock-analytics";
import { createCrmStore, type CrmStore } from "./crm-store";
import { createMockStore, type MockStore } from "./mock-store";
import { createViewStore, type ViewStore } from "./view-store";
import { mockListDatasets, mockListRecords, mockSetDatasetEnabled } from "./mock-data-sources";
import { createTeamStore, type TeamStore } from "./team-store";
import { createSettingsStore, type SettingsStore } from "./settings-store";
import { createReportStore, type ReportStore } from "@/lib/reports/store";
import { mockReportContent, mockReportContext } from "./mock-reports";
import type { CorDataSource, User } from "./types";

// Sample Northwind admin matching the design system's example data; the workspace lives in the settings store.
const signedInUser: User = {
  id: "u_david",
  name: "David Chousal",
  email: "dchousal@northwind.co",
  role: "admin",
  initials: "DC",
};

// One in-memory store per server process; kept on globalThis so dev hot reloads don't reset it.
const holder = globalThis as typeof globalThis & { __corMockStore?: MockStore; __corCrmStore?: CrmStore; __corViewStore?: ViewStore; __corTeamStore?: TeamStore; __corSettingsStore?: SettingsStore; __corReportStore?: ReportStore };
const store = (holder.__corMockStore ??= createMockStore(Date.now));
const crm = (holder.__corCrmStore ??= createCrmStore(Date.now));
const views = (holder.__corViewStore ??= createViewStore());
const team = (holder.__corTeamStore ??= createTeamStore(Date.now, signedInUser.id));
const settings = (holder.__corSettingsStore ??= createSettingsStore(Date.now, signedInUser));
const reports = (holder.__corReportStore ??= createReportStore(Date.now));
const workspace = () => settings.workspace();
const reportContext = () => mockReportContext(store.listConnections(), crm.get(), workspace(), Date.now());
const hasCrm = () => attributionContext(crm.get()).source === "crm";

const MOCK_LATENCY_MS = 600;
const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

export const mockDataSource: CorDataSource = {
  getWorkspace: async () => workspace(),
  getCurrentUser: async () => settings.user(),
  listConnections: async () => store.listConnections(),
  connectPlatform: async (platform) => store.connect(platform),
  reconnect: async (connectionId) => store.reconnect(connectionId),
  disconnect: async (connectionId) => store.disconnect(connectionId),
  syncNow: async (connectionId) => {
    await delay();
    return store.syncNow(connectionId);
  },
  getCrm: async () => crm.get(),
  connectCrm: async () => crm.connect(),
  reconnectCrm: async () => crm.reconnect(),
  disconnectCrm: async () => crm.disconnect(),
  syncCrm: async () => {
    await delay();
    return crm.sync();
  },
  updateCrmSettings: async (settings) => crm.updateSettings(settings),
  listCampaigns: async () => mockCampaigns(store.listConnections(), workspace(), Date.now()),
  getAnalytics: async (filter) => mockAnalytics(store.listConnections(), crm.get(), workspace(), filter, Date.now()),
  listViews: async () => views.list(),
  createView: async (name, bays) => views.create(name, bays),
  saveView: async (id, bays) => views.save(id, bays),
  deleteView: async (id) => views.remove(id),
  listDatasets: async (sourceId) => mockListDatasets({ store, crm, workspace: workspace() }, sourceId, Date.now()),
  setDatasetEnabled: async (sourceId, datasetId, enabled) => mockSetDatasetEnabled({ store, crm, workspace: workspace() }, sourceId, datasetId, enabled),
  listRecords: async (sourceId, datasetId, query) => mockListRecords({ store, crm, workspace: workspace() }, sourceId, datasetId, query, Date.now()),
  listMembers: async () => team.members(),
  listInvites: async () => team.invites(),
  inviteMembers: async (emails, role) => team.invite(emails, role),
  resendInvite: async (inviteId) => team.resend(inviteId),
  revokeInvite: async (inviteId) => team.revoke(inviteId),
  changeRole: async (memberId, role) => team.changeRole(memberId, role),
  removeMember: async (memberId) => team.remove(memberId),
  getPreferences: async () => settings.preferences(),
  updateProfile: async (input) => {
    settings.updateProfile(input);
    return settings.user();
  },
  updateWorkspace: async (input) => {
    settings.updateWorkspace(input);
    return settings.workspace();
  },
  getNotifications: async () => settings.notifications(),
  updateNotifications: async (prefs) => {
    settings.updateNotifications(prefs);
    return settings.notifications();
  },
  listAlerts: async () => settings.alerts(),
  createAlert: async (draft) => settings.createAlert(draft, { hasCrm: hasCrm() }),
  updateAlert: async (alertId, draft) => settings.updateAlert(alertId, draft, { hasCrm: hasCrm() }),
  setAlertPaused: async (alertId, paused) => settings.setAlertPaused(alertId, paused),
  deleteAlert: async (alertId) => settings.deleteAlert(alertId),
  getAlertSeries: async () => mockAlertSeries(store.listConnections(), crm.get(), workspace(), Date.now()),
  listReports: async () => reports.list(),
  getReport: async (reportId) => reports.get(reportId),
  saveReport: async (reportId, input) => reports.save(reportId, input, settings.user(), reportContext()),
  deleteReport: async (reportId) => reports.remove(reportId, settings.user()),
  getReportContext: async () => reportContext(),
  getReportContent: async (input) => mockReportContent(input, { connections: store.listConnections(), crm: crm.get(), workspace: workspace() }, Date.now()),
};
