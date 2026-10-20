import type { BayKind } from "@/lib/analytics/layout";

/** A 40×28 miniature of each bay type for the library. */
export function BayGlyph({ kind }: { kind: BayKind }) {
  return (
    <svg className="glyph" viewBox="0 0 40 28" aria-hidden="true" fill="none">
      <path d="M0 1h40" style={{ stroke: "var(--rail)" }} strokeWidth="2" />
      {kind === "readout" && <><rect x="2" y="8" width="22" height="8" style={{ fill: "var(--ink)" }} /><path d="M2 23h36" style={{ stroke: "var(--line-strong)" }} /><circle cx="28" cy="23" r="2" style={{ fill: "var(--ink)" }} /></>}
      {kind === "trace" && <><path d="M2 24l9-6 8 3 9-11 10-3" style={{ stroke: "var(--ch-1)" }} strokeWidth="2" /><path d="M2 26l9-3 8 1 9-5 10-2" style={{ stroke: "var(--ch-2)" }} strokeWidth="2" /></>}
      {kind === "ledger" && <><path d="M14 5v22" style={{ stroke: "var(--rail)" }} strokeWidth="2" /><rect x="6" y="8" width="8" height="5" style={{ fill: "var(--ink-muted)" }} /><rect x="15" y="8" width="22" height="5" style={{ fill: "var(--ch-1)" }} /><rect x="9" y="17" width="5" height="5" style={{ fill: "var(--ink-muted)" }} /><rect x="15" y="17" width="12" height="5" style={{ fill: "var(--ch-2)" }} /></>}
      {kind === "share" && <><circle cx="20" cy="16" r="8" style={{ stroke: "var(--ch-1)" }} strokeWidth="4" strokeDasharray="30 50" /><circle cx="20" cy="16" r="8" style={{ stroke: "var(--ch-2)" }} strokeWidth="4" strokeDasharray="20 50" strokeDashoffset="-31" /></>}
      {kind === "campaigns" && <>{[8, 14, 20, 26].map((y) => <path key={y} d={`M2 ${y}h36`} style={{ stroke: "var(--line-strong)" }} />)}<rect x="26" y="9" width="10" height="3" style={{ fill: "var(--ch-1)" }} /></>}
    </svg>
  );
}
