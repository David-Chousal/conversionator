import { formatCount } from "@/lib/format";
import { freshnessSignal, type Signal } from "./sync";
import type { CrmConnection, LeadStage } from "./types";

export const LEAD_STAGE_NAMES: Record<LeadStage, string> = { lead: "Lead", mql: "Marketing qualified lead", sql: "Sales qualified lead" };

export function crmSignal(crm: CrmConnection, now: number): Signal {
  if (crm.status === "failed") return { state: "failed", lit: 0, word: "Failed" };
  if (crm.status === "available") return { state: "off", lit: 0, word: "Not connected" };
  if (crm.status === "syncing" || !crm.lastSyncedAt) return { state: "ok", lit: 4, word: "Syncing" };
  return freshnessSignal(crm.lastSyncedAt, now);
}

export function crmRecordsLine(crm: CrmConnection): string {
  return `${formatCount(crm.records.contacts)} contacts · ${formatCount(crm.records.deals)} deals`;
}
