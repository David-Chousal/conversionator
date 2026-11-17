import "server-only"
import { CorDataSource } from "./types";
import { cookies } from "next/headers";

const TOKEN_COOKIE_NAME = "cor_token";

interface BackendConnection {
  login(username: string, password_hash: string): void;
  logout(token: string): void;
}

class HeadersBuilder {
  private pairs: Record<string, string>;

  constructor() {
    this.pairs = {}
  }

  with_token(token: string): HeadersBuilder {
    this.pairs["Authorization"] ??= `Bearer ${token}`;
    return this;
  }

  content_type_json(): HeadersBuilder {
    this.pairs["Content-Type"] ??= "application/json";
    return this
  }

  build(): Record<string, string> {
    return this.pairs;
  }

  static default(): HeadersBuilder {
    return new HeadersBuilder().content_type_json();
  }
}

async function token(): Promise<string> {
  const token = (await cookies()).get(TOKEN_COOKIE_NAME)?.value;
  if (!token) {
    throw new Error("Please log in again.");
  }
  return token;
}

async function call(
  method: "GET" | "POST" | "HEAD",
  base: string,
  path: string,
  headers?: HeadersInit,
  body?: string,
  overrideHeaders?: HeadersInit
): Promise<Response> {
  const req = new Request(`${base}${path}`, {
    method,
    headers: {
      ...headers,
      ...HeadersBuilder.default().build(),
      ...overrideHeaders,
    },
    cache: "no-store",
    body,
  });

  const timeout_ms = 10000;

  return await Promise.race([
    fetch(req),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject("connection timed out");
      }, timeout_ms);
    })
  ]);
}

class ConcreteBackendConnection implements BackendConnection {
  private base: string;

  constructor(base: string) {
    this.base = base;
  }

  async login(username: string, password_hash: string): Promise<string | undefined> {
    const headers = HeadersBuilder.default().build();
    const param = { username: username, password_hash: password_hash };
    const body = JSON.stringify(param);
    const res = await call("POST", this.base, "/auth/login", headers, body);
    if (!res.ok) {
      return undefined;
    }
    return await res.body?.getReader().read() as unknown as string;
  }

  async logout(token: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

export function backendDataSource(address: string, port: number, tls: boolean = false): Partial<CorDataSource> {
  const base = `http{tls ? 's' : ''}://{address}:{port}`;
  const conn = new ConcreteBackendConnection();
  return {
    getWorkspace: undefined,
    getCurrentUser: undefined,
    listConnections: undefined,
    connectPlatform: undefined,
    reconnect: undefined,
    disconnect: undefined,
    syncNow: undefined,
    getCrm: undefined,
    connectCrm: undefined,
    reconnectCrm: undefined,
    disconnectCrm: undefined,
    syncCrm: undefined,
    updateCrmSettings: undefined,
    listCampaigns: undefined,
    getAnalytics: undefined,
    listViews: undefined,
    createView: undefined,
    saveView: undefined,
    deleteView: undefined,
    listDatasets: undefined,
    setDatasetEnabled: undefined,
    listRecords: undefined,
    listMembers: undefined,
    listInvites: undefined,
    inviteMembers: undefined,
    resendInvite: undefined,
    revokeInvite: undefined,
    changeRole: undefined,
    removeMember: undefined,
    getPreferences: undefined,
    updateProfile: undefined,
    updateWorkspace: undefined,
    getNotifications: undefined,
    updateNotifications: undefined,
    listAlerts: undefined,
    createAlert: undefined,
    updateAlert: undefined,
    setAlertPaused: undefined,
    deleteAlert: undefined,
    getAlertSeries: undefined,
    listReports: undefined,
    getReport: undefined,
    saveReport: undefined,
    deleteReport: undefined,
    getReportContext: undefined,
    getReportContent: undefined,
  }
}


// export interface CorDataSource {
//   getWorkspace(): Promise<Workspace>;
//   getCurrentUser(): Promise<User>;
//   /** Connected platforms first (by channel code), then platforms available to connect. */
//   listConnections(): Promise<Connection[]>;
//   /** Called after the platform's own sign-in approves access. */
//   connectPlatform(platform: Platform): Promise<Connection>;
//   reconnect(connectionId: string): Promise<Connection>;
//   /** Removes the connection and deletes the data COR stored from it. */
//   disconnect(connectionId: string): Promise<void>;
//   syncNow(connectionId: string): Promise<SyncResult>;
//   getCrm(): Promise<CrmConnection>;
//   /** Called after the CRM's own sign-in approves access. */
//   connectCrm(): Promise<CrmConnection>;
//   reconnectCrm(): Promise<CrmConnection>;
//   /** Removes the CRM and deletes the contacts and deals COR stored from it. */
//   disconnectCrm(): Promise<void>;
//   syncCrm(): Promise<SyncResult>;
//   updateCrmSettings(settings: CrmSettings): Promise<CrmConnection>;
//   /** Campaigns across connected platforms, for filters and validation. */
//   listCampaigns(): Promise<CampaignInfo[]>;
//   /** Everything the Analytics page shows for one filter. */
//   getAnalytics(filter: AnalyticsFilter): Promise<AnalyticsReport>;
//   /** The current user's saved Analytics views, Default first. */
//   listViews(): Promise<SavedView[]>;
//   createView(name: string, bays: BayConfig[]): Promise<SavedView>;
//   /** Null puts the view back on the system default layout. */
//   saveView(id: string, bays: BayConfig[] | null): Promise<SavedView>;
//   deleteView(id: string): Promise<void>;
//   /** Datasets for an ad connection id or the CRM source id, with stored record counts. */
//   listDatasets(sourceId: string): Promise<DatasetSummary[]>;
//   setDatasetEnabled(sourceId: string, datasetId: string, enabled: boolean): Promise<void>;
//   listRecords(sourceId: string, datasetId: string, query: RecordQuery): Promise<RecordPage>;
//   listMembers(): Promise<Member[]>;
//   listInvites(): Promise<Invite[]>;
//   /** Sends invitations; refuses the whole batch if any address can't be invited. */
//   inviteMembers(emails: string[], role: Role): Promise<Invite[]>;
//   resendInvite(inviteId: string): Promise<Invite>;
//   revokeInvite(inviteId: string): Promise<void>;
//   changeRole(memberId: string, role: Role): Promise<Member>;
//   /** Removes a member; they lose access immediately. */
//   removeMember(memberId: string): Promise<void>;
//   /** The current user's personal preferences. */
//   getPreferences(): Promise<Preferences>;
//   updateProfile(input: ProfileInput): Promise<User>;
//   /** Admins only: name, currency, time zone and week start for everyone. */
//   updateWorkspace(input: WorkspaceInput): Promise<Workspace>;
//   getNotifications(): Promise<NotificationPrefs>;
//   updateNotifications(prefs: NotificationPrefs): Promise<NotificationPrefs>;
//   /** Workspace alerts plus the current user's personal alerts, newest first. */
//   listAlerts(): Promise<AlertRule[]>;
//   createAlert(draft: AlertDraft): Promise<AlertRule>;
//   updateAlert(alertId: string, draft: AlertDraft): Promise<AlertRule>;
//   setAlertPaused(alertId: string, paused: boolean): Promise<void>;
//   deleteAlert(alertId: string): Promise<void>;
//   /** Recent daily totals per channel, for checking alert rules. */
//   getAlertSeries(): Promise<AlertSeries>;
//   /** Every report in the workspace, most recently changed first. */
//   listReports(): Promise<Report[]>;
//   getReport(reportId: string): Promise<Report | null>;
//   /** Creates (null id) or updates a report; owners and admins only for updates. */
//   saveReport(reportId: string | null, input: ReportInput): Promise<Report>;
//   deleteReport(reportId: string): Promise<void>;
//   /** Channels a report can include, today, and the attribution source. */
//   getReportContext(): Promise<ReportContext & { source: AttributionSource }>;
//   /** The report's numbers for its window and channels, as the preview and exports show them. */
//   getReportContent(input: ReportInput): Promise<ReportContent>;
// }