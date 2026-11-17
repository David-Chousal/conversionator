import { CorDataSource } from "./types";
import type { Connection, ConnectionStatus, Platform, SyncResult, User } from "./types";
import type { Report, ReportContent, ReportInput } from "@/lib/reports/types";
import { cookies } from "next/headers";
import { DataSourceError, type DataSourceErrorCode } from "./errors";

/**
 * HTTP-backed data source for the Rust backend.
 *
 * REAL backend endpoints (implemented in Rust today):
 *   POST /auth/login  { username, password }             -> token string
 *   POST /auth/logout { token }                          -> empty
 *
 * IMAGINED endpoints (this file defines the contract the backend will grow into; see the
 * plan discussion — the sources/charts/me routes do not exist in Rust yet):
 *   GET    /me                        -> BackendUser
 *   GET    /sources                   -> BackendSource[]
 *   POST   /sources                   { platform }            -> BackendSource
 *   POST   /sources/:id/reconnect                             -> BackendSource
 *   DELETE /sources/:id                                       -> 204
 *   POST   /sources/:id/sync                                  -> { rows, finishedAt }
 *   GET    /charts                    -> BackendChart[]
 *   GET    /charts/:id                -> BackendChart
 *   POST   /charts                    { title, type, data }   -> BackendChart
 *   PUT    /charts/:id                { title, type, data }   -> BackendChart
 *   DELETE /charts/:id                                        -> 204
 *   POST   /charts/preview            { ReportInput }         -> ReportContent JSON
 *
 * IMAGINED conventions:
 *   - Chart.data is a JSON-serialized ReportInput; the chart `type` is fixed to "bar"
 *     until the composer gains a chart-type picker.
 *   - Errors: { code, message } with 400/422 invalid_input, 401 needs_reconnect,
 *     403/404 not_found, 409 one of the DataSourceErrorCodes.
 */

export const TOKEN_COOKIE_NAME = "cor_token";

/** Backend address from env; null when the real backend isn't configured for this deployment. */
export function backendConfig(): { address: string; port: number; tls: boolean } | null {
  const address = process.env.COR_BACKEND_ADDRESS;
  if (!address) return null;
  return {
    address,
    port: Number(process.env.COR_BACKEND_PORT ?? 3001),
    tls: process.env.COR_BACKEND_TLS === "true",
  };
}

/** Auth client for the login/logout server actions, or null when no backend is configured. */
export function backendClient(): ConcreteBackendConnection | null {
  const config = backendConfig();
  if (!config) return null;
  return new ConcreteBackendConnection(`${config.tls ? "https" : "http"}://${config.address}:${config.port}`);
}

interface BackendConnection {
  login(username: string, password: string): Promise<string | undefined>;
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
    throw new DataSourceError("needs_reconnect", "Please sign in again.");
  }
  return token;
}

async function call(
  method: "GET" | "POST" | "PUT" | "DELETE" | "HEAD",
  base: string,
  path: string,
  headers?: HeadersInit,
  body?: string,
): Promise<Response> {
  const req = new Request(`${base}${path}`, {
    method,
    headers: {
      ...headers,
      ...HeadersBuilder.default().build(),
    },
    cache: "no-store",
    body,
    signal: AbortSignal.timeout(10_000),
  });

  return await fetch(req);
}

const STATUS_CODES: Record<number, DataSourceErrorCode> = {
  400: "invalid_input",
  401: "needs_reconnect",
  403: "not_found",
  404: "not_found",
  409: "sync_in_progress",
  422: "invalid_input",
};

const isErrorCode = (value: unknown): value is DataSourceErrorCode =>
  typeof value === "string" && value in STATUS_CODES;

/** Turns a non-2xx response into the one expected-error type the UI understands. */
async function failure(res: Response): Promise<never> {
  if (res.status >= 500) throw new Error(`Backend request failed (${res.status}).`);
  let code = STATUS_CODES[res.status] ?? "invalid_input";
  let message = `Request failed (${res.status}).`;
  try {
    const body = await res.json() as { code?: string; message?: string };
    if (typeof body.message === "string") message = body.message;
    if (isErrorCode(body.code)) code = body.code;
  } catch { /* non-JSON error body: keep the fallbacks */ }
  throw new DataSourceError(code, message);
}

/** Authenticated JSON call; every method below funnels through here. */
async function api<T>(method: "GET" | "POST" | "PUT" | "DELETE", base: string, path: string, body?: unknown): Promise<T> {
  const headers = HeadersBuilder.default().with_token(await token()).build();
  const res = await call(method, base, path, headers, body === undefined ? undefined : JSON.stringify(body));
  if (!res.ok) await failure(res);
  if (res.status === 204) return undefined as T;
  return await res.json() as T;
}

/** Auth client for the login/logout server actions (wired up outside this file). */
/** Auth client for the login/logout server actions (wired up outside this file). */
export class ConcreteBackendConnection implements BackendConnection {
  private base: string;

  constructor(base: string) {
    this.base = base;
  }

  /** Sends the plain password; the backend hashes (bcrypt) and verifies server-side. */
  async login(username: string, password: string): Promise<string | undefined> {
    const headers = HeadersBuilder.default().build();
    const body = JSON.stringify({ username, password });
    const res = await call("POST", this.base, "/auth/login", headers, body);
    if (!res.ok) {
      return undefined;
    }
    return await res.text();
  }

  async logout(token: string): Promise<void> {
    const headers = HeadersBuilder.default().build();
    const res = await call("POST", this.base, "/auth/logout", headers, JSON.stringify({ token }));
    if (!res.ok) throw new DataSourceError("needs_reconnect", "Could not sign out; try again.");
  }
}

// ----- Imagined backend response shapes and their mappings onto the frontend contract -----

/** Imagined GET /me. */
interface BackendUser {
  id: number | string;
  username: string;
  email: string;
  role: "admin" | "user";
}

/** Imagined source row (GET/POST /sources). Mirrors the class diagram's ExternalDataSource. */
interface BackendSource {
  id: number | string;
  platform: Platform;
  name: string;
  status?: ConnectionStatus;
  lastSyncedAt: string | null;
  syncIntervalSeconds?: number | null;
  account?: string;
  channelCode?: string;
}

/** Imagined chart row (GET/POST /charts). Mirrors the class diagram's Chart. */
interface BackendChart {
  id: number | string;
  title: string;
  type: "bar" | "line" | "pie" | "scatter";
  /** JSON-serialized ReportInput (imagined convention). */
  data: string;
  userId: number | string;
  createdAt: string;
  updatedAt: string;
}

const PLATFORMS: Platform[] = ["google-ads", "meta-ads", "linkedin-ads", "tiktok-ads", "microsoft-ads"];

function toUser(u: BackendUser): User {
  const name = u.username;
  return {
    id: String(u.id),
    name,
    email: u.email,
    role: u.role === "admin" ? "admin" : "member",
    initials: name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join(""),
  };
}

function toConnection(s: BackendSource): Connection {
  return {
    id: String(s.id),
    channelCode: s.channelCode ?? `CH·${String(PLATFORMS.indexOf(s.platform) + 1).padStart(2, "0")}`,
    platform: s.platform,
    name: s.name,
    account: s.account ?? s.name,
    status: s.status ?? "available",
    lastSyncedAt: s.lastSyncedAt,
    datasets: { enabled: 1, total: 1 },
    nextSyncAt: s.lastSyncedAt && s.syncIntervalSeconds
      ? new Date(new Date(s.lastSyncedAt).getTime() + s.syncIntervalSeconds * 1000).toISOString()
      : null,
  };
}

function toReport(c: BackendChart): Report {
  const stored = JSON.parse(c.data) as ReportInput & { ownerName?: string };
  return {
    ...stored,
    id: String(c.id),
    ownerId: String(c.userId),
    ownerName: stored.ownerName ?? "",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// The backend only implements auth so far; every method added here must shadow the mock
// counterpart at the call site: `{ ...mockDataSource, ...backendDataSource(addr, port) }`.
// Methods left unimplemented are simply omitted, so the mock keeps serving them.
export function backendDataSource(address: string, port: number, tls: boolean = false): Partial<CorDataSource> {
  const base = `http${tls ? "s" : ""}://${address}:${port}`;

  const chartBody = (input: ReportInput) => ({
    title: input.name,
    type: "bar" as const, // imagined: fixed until the composer offers chart types
    data: JSON.stringify(input),
  });

  return {
    // ----- Session -----
    getCurrentUser: async () => toUser(await api<BackendUser>("GET", base, "/me")),

    // ----- Connections (external data sources) -----
    listConnections: async () => (await api<BackendSource[]>("GET", base, "/sources")).map(toConnection),
    connectPlatform: async (platform) => toConnection(await api<BackendSource>("POST", base, "/sources", { platform })),
    reconnect: async (connectionId) => toConnection(await api<BackendSource>("POST", base, `/sources/${connectionId}/reconnect`)),
    disconnect: async (connectionId) => { await api<void>("DELETE", base, `/sources/${connectionId}`); },
    syncNow: async (connectionId) => await api<SyncResult>("POST", base, `/sources/${connectionId}/sync`),

    // ----- Reports (charts) -----
    listReports: async () => (await api<BackendChart[]>("GET", base, "/charts")).map(toReport),
    getReport: async (reportId) => {
      try {
        return toReport(await api<BackendChart>("GET", base, `/charts/${reportId}`));
      } catch (error) {
        if (error instanceof DataSourceError && error.code === "not_found") return null;
        throw error;
      }
    },
    saveReport: async (reportId, input) =>
      toReport(await api<BackendChart>(reportId ? "PUT" : "POST", base, reportId ? `/charts/${reportId}` : "/charts", chartBody(input))),
    deleteReport: async (reportId) => { await api<void>("DELETE", base, `/charts/${reportId}`); },
    getReportContent: async (input) => await api<ReportContent>("POST", base, "/charts/preview", input),
  };
}
