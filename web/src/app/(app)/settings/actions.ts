"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { runAdmin, runAsUser, type ActionResult } from "@/lib/actions/admin";
import { LEAD_STAGES, dataSource, type AlertRule, type LeadStage, type SyncResult } from "@/lib/data";
import { parseAlertDraft, parseNotifications, parseProfile, parseWorkspaceInput } from "@/lib/data/settings-parse";

export async function syncCrmAction(): Promise<ActionResult<SyncResult>> {
  const result = await runAdmin(() => dataSource.syncCrm());
  refresh();
  return result;
}

export async function disconnectCrmAction(): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    await dataSource.disconnectCrm();
    return null;
  });
  refresh();
  return result;
}

export async function updateLeadStageAction(leadStage: LeadStage): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    if (!LEAD_STAGES.includes(leadStage)) throw new Error(`Unknown lead stage: ${String(leadStage)}`);
    await dataSource.updateCrmSettings({ leadStage });
    return null;
  });
  refresh();
  return result;
}

/** HubSpot's sign-in approved access: connect or renew, then return to Settings. */
export async function approveCrmAuthorization(formData: FormData): Promise<void> {
  const reconnecting = formData.get("mode") === "reconnect";
  const result = await runAdmin(() => (reconnecting ? dataSource.reconnectCrm() : dataSource.connectCrm()));
  if (!result.ok) redirect(`/settings?tab=crm&failed=hubspot&reason=${encodeURIComponent(result.message)}`);
  redirect(`/settings?tab=crm&${reconnecting ? "reconnected" : "connected"}=hubspot`);
}

export async function cancelCrmAuthorization(): Promise<void> {
  redirect("/settings?tab=crm&cancelled=hubspot");
}

/* ───── General, workspace, notifications ───── */

export async function updateProfileAction(input: unknown): Promise<ActionResult<null>> {
  const result = await runAsUser(async () => {
    await dataSource.updateProfile(parseProfile(input));
    return null;
  });
  refresh();
  return result;
}

export async function updateWorkspaceAction(input: unknown): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    await dataSource.updateWorkspace(parseWorkspaceInput(input));
    return null;
  });
  refresh();
  return result;
}

export async function updateNotificationsAction(input: unknown): Promise<ActionResult<null>> {
  const result = await runAsUser(async () => {
    await dataSource.updateNotifications(parseNotifications(input));
    return null;
  });
  refresh();
  return result;
}

/* ───── Alerts ───── */

export async function saveAlertAction(alertId: string | null, draft: unknown): Promise<ActionResult<AlertRule>> {
  const result = await runAsUser(() => {
    const parsed = parseAlertDraft(draft);
    return typeof alertId === "string" ? dataSource.updateAlert(alertId, parsed) : dataSource.createAlert(parsed);
  });
  refresh();
  return result;
}

export async function setAlertPausedAction(alertId: string, paused: boolean): Promise<ActionResult<null>> {
  const result = await runAsUser(async () => {
    await dataSource.setAlertPaused(String(alertId), paused === true);
    return null;
  });
  refresh();
  return result;
}

export async function deleteAlertAction(alertId: string): Promise<ActionResult<null>> {
  const result = await runAsUser(async () => {
    await dataSource.deleteAlert(String(alertId));
    return null;
  });
  refresh();
  return result;
}
