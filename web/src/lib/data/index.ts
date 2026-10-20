import { mockDataSource } from "./mock";
import type { CorDataSource } from "./types";

// Swap for the real API client once the unified data layer exists; pages import only from here.
export const dataSource: CorDataSource = mockDataSource;

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
