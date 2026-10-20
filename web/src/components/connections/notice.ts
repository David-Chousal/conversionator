import { PLATFORMS } from "@/lib/data/catalog";
import type { ConnectionsNotice } from "./ConnectionsBoard";

type Query = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const nameOf = (platform: string | undefined) => PLATFORMS.find((info) => info.platform === platform)?.name;

/** Turns the query string the sign-in step redirects with into a notice for the board. */
export function parseNotice(query: Query): ConnectionsNotice | undefined {
  for (const kind of ["connected", "reconnected", "cancelled"] as const) {
    const platformName = nameOf(first(query[kind]));
    if (platformName) return { kind, platformName };
  }
  const failedName = nameOf(first(query.failed));
  if (failedName) return { kind: "failed", platformName: failedName, reason: first(query.reason) ?? "Try again." };
  return undefined;
}
