import { mockDataSource } from "./mock";
import { backendConfig, backendDataSource } from "./backend-connection";
import type { CorDataSource } from "./types";

// The real backend is opt-in via COR_BACKEND_ADDRESS (COR_BACKEND_PORT, COR_BACKEND_TLS optional).
// backendDataSource only implements what the Rust server covers; unimplemented methods fall
// through to the mock. Pages import only from here.
const backend = backendConfig();

export const dataSource: CorDataSource = backend
  ? { ...mockDataSource, ...backendDataSource(backend.address, backend.port, backend.tls) }
  : mockDataSource;

export * from "./types";
export * from "./sync";
export * from "./errors";
export * from "./catalog";
export * from "./describe";
export { LEAD_STAGES } from "./crm-store";
export { CRM_SOURCE_ID, type DatasetSummary } from "./datasets";
export type { RecordPage, RecordQuery, RecordRow } from "./mock-records";
export type { Invite, InviteProblem, Member } from "./team-types";
export type * from "./settings-types";
