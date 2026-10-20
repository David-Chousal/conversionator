import { formatAge } from "@/lib/format";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** Every healthy source syncs on its own this often; Sync now is only for when you can't wait. */
export const AUTO_SYNC_MS = 60 * MINUTE;
const RENEW_WITHIN_MS = 7 * DAY;
const ACCESS_LIFETIME_MS = 60 * DAY;

/** The latest scheduled run at or before now, given the last sync: what the background job would have done. */
export function catchUp(lastSyncedAt: number, now: number): number {
  const missed = Math.floor((now - lastSyncedAt) / AUTO_SYNC_MS);
  return missed > 0 ? lastSyncedAt + missed * AUTO_SYNC_MS : lastSyncedAt;
}

export const nextSyncAt = (lastSyncedAt: number): number => lastSyncedAt + AUTO_SYNC_MS;

/** Access tokens are refreshed in the background a week before they run out, so nobody has to reconnect for that. */
export function renewAccess(expiresAt: number, now: number): number {
  return expiresAt - now < RENEW_WITHIN_MS ? now + ACCESS_LIFETIME_MS : expiresAt;
}

/** "Auto · next in 56m" for a source on the schedule; null when it isn't on one (not synced yet, or needs reconnecting). */
export function syncTiming(lastSyncedAt: string | null, next: string | null, now: number): string | null {
  if (!lastSyncedAt || !next) return null;
  const remaining = Date.parse(next) - now;
  return remaining > 0 ? `Auto · next in ${formatAge(remaining)}` : "Auto · syncing soon";
}
