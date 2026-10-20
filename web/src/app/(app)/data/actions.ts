"use server";

import { refresh } from "next/cache";
import { runAdmin, type ActionResult } from "@/lib/actions/admin";
import { CRM_SOURCE_ID, dataSource, type SyncResult } from "@/lib/data";

export async function setDatasetEnabledAction(sourceId: string, datasetId: string, enabled: boolean): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    await dataSource.setDatasetEnabled(String(sourceId), String(datasetId), Boolean(enabled));
    return null;
  });
  refresh();
  return result;
}

export async function syncSourceAction(sourceId: string): Promise<ActionResult<SyncResult>> {
  const result = await runAdmin(() => (sourceId === CRM_SOURCE_ID ? dataSource.syncCrm() : dataSource.syncNow(String(sourceId))));
  refresh();
  return result;
}

/** Removes the source and deletes everything COR stored from it. */
export async function removeSourceAction(sourceId: string): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    if (sourceId === CRM_SOURCE_ID) await dataSource.disconnectCrm();
    else await dataSource.disconnect(String(sourceId));
    return null;
  });
  refresh();
  return result;
}
