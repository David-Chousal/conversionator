"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { runAdmin as run, type ActionResult } from "@/lib/actions/admin";
import { PLATFORMS, dataSource, type Platform, type SyncResult } from "@/lib/data";

export type { ActionResult };

function parsePlatform(value: FormDataEntryValue | null): Platform | null {
  return PLATFORMS.find((info) => info.platform === value)?.platform ?? null;
}

export async function syncNowAction(connectionId: string): Promise<ActionResult<SyncResult>> {
  const result = await run(() => dataSource.syncNow(connectionId));
  refresh();
  return result;
}

export async function disconnectAction(connectionId: string): Promise<ActionResult<null>> {
  const result = await run(async () => {
    await dataSource.disconnect(connectionId);
    return null;
  });
  refresh();
  return result;
}

/** The platform's sign-in approved access: create or renew the connection, then go back to Connections. */
export async function approveAuthorization(formData: FormData): Promise<void> {
  const platform = parsePlatform(formData.get("platform"));
  if (!platform) redirect("/connections");
  const connectionId = formData.get("connection");
  const reconnecting = formData.get("mode") === "reconnect" && typeof connectionId === "string";

  const result = await run(() => (reconnecting ? dataSource.reconnect(connectionId) : dataSource.connectPlatform(platform)));
  if (!result.ok) redirect(`/connections?failed=${platform}&reason=${encodeURIComponent(result.message)}`);
  redirect(`/connections?${reconnecting ? "reconnected" : "connected"}=${platform}`);
}

export async function cancelAuthorization(formData: FormData): Promise<void> {
  const platform = parsePlatform(formData.get("platform"));
  redirect(platform ? `/connections?cancelled=${platform}` : "/connections");
}
