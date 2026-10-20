export type CrmNoticeData = { kind: "connected" | "reconnected" | "cancelled" } | { kind: "failed"; reason: string };

type Query = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** Reads the result of the HubSpot sign-in from the query string. */
export function parseCrmNotice(query: Query): CrmNoticeData | undefined {
  for (const kind of ["connected", "reconnected", "cancelled"] as const) if (first(query[kind]) === "hubspot") return { kind };
  if (first(query.failed) === "hubspot") return { kind: "failed", reason: first(query.reason) ?? "Try again." };
  return undefined;
}
