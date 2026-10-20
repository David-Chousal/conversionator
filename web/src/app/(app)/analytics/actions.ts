"use server";

import { refresh } from "next/cache";
import { runAsUser, type ActionResult } from "@/lib/actions/admin";
import type { BayConfig, SavedView } from "@/lib/analytics/layout";
import { dataSource } from "@/lib/data";

// Views are personal, so any signed-in user may change their own. Layouts are validated by the data source.

export async function createViewAction(name: string, bays: BayConfig[]): Promise<ActionResult<SavedView>> {
  const result = await runAsUser(() => dataSource.createView(String(name), bays));
  refresh();
  return result;
}

export async function saveViewAction(id: string, bays: BayConfig[] | null): Promise<ActionResult<SavedView>> {
  const result = await runAsUser(() => dataSource.saveView(String(id), bays));
  refresh();
  return result;
}

export async function deleteViewAction(id: string): Promise<ActionResult<null>> {
  const result = await runAsUser(async () => {
    await dataSource.deleteView(String(id));
    return null;
  });
  refresh();
  return result;
}
