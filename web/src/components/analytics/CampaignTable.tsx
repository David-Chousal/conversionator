"use client";

import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import type { AttributionSource, CampaignRow, Totals } from "@/lib/analytics/types";
import { formatCompactCount, formatCount, formatMoney, formatRate, formatRoas } from "@/lib/format";
import { channelColor } from "./color";

interface CampaignTableProps {
  rows: CampaignRow[];
  totals: Totals;
  currency: string;
  source: AttributionSource;
}

type SortKey = "spend" | "impressions" | "ctr" | "cpc" | "conversions" | "cpa" | "roas" | "leads" | "cpl";

interface Column {
  key: SortKey;
  label: string;
  value: (totals: Totals) => number | null;
  format: (value: number, currency: string) => string;
  /** CPC and CPA: lower is better, so the first click sorts ascending. */
  lowerIsBetter?: boolean;
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);
const cents = (v: number, c: string) => formatMoney(v, { currency: c, cents: true });
const DELIVERY: Column[] = [
  { key: "spend", label: "Spend", value: (t) => t.spend, format: (v, c) => formatMoney(v, { currency: c }) },
  { key: "impressions", label: "Impr.", value: (t) => t.impressions, format: (v) => formatCompactCount(v) },
  { key: "ctr", label: "CTR", value: (t) => ratio(t.clicks, t.impressions), format: (v) => formatRate(v) },
  { key: "cpc", label: "CPC", value: (t) => ratio(t.spend, t.clicks), format: cents, lowerIsBetter: true },
];
const ROAS: Column = { key: "roas", label: "ROAS", value: (t) => ratio(t.revenue, t.spend), format: (v) => formatRoas(v) };
// With a CRM: HubSpot's leads and closed-won deals. Without: each platform's own conversions.
const OUTCOMES: Record<AttributionSource, Column[]> = {
  crm: [
    { key: "leads", label: "Leads", value: (t) => t.leads, format: (v) => formatCount(v) },
    { key: "cpl", label: "CPL", value: (t) => ratio(t.spend, t.leads), format: cents, lowerIsBetter: true },
    { key: "conversions", label: "Deals", value: (t) => t.conversions, format: (v) => formatCount(v) },
    ROAS,
  ],
  platform: [
    { key: "conversions", label: "Conv.", value: (t) => t.conversions, format: (v) => formatCount(v) },
    { key: "cpa", label: "CPA", value: (t) => ratio(t.spend, t.conversions), format: cents, lowerIsBetter: true },
    ROAS,
  ],
};
const PAGE_SIZE = 25;

function sortRows(rows: CampaignRow[], column: Column, direction: "ascending" | "descending"): CampaignRow[] {
  const sign = direction === "ascending" ? 1 : -1;
  // Missing values (no conversions for CPA) always sort last.
  return [...rows].sort((a, b) => {
    const va = column.value(a);
    const vb = column.value(b);
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va - vb) * sign;
  });
}

/** Campaigns in the window: sortable, paged, with totals that match the readouts. */
export function CampaignTable({ rows, totals, currency, source }: CampaignTableProps) {
  const columns = [...DELIVERY, ...OUTCOMES[source]];
  const [sort, setSort] = useState<{ key: SortKey; direction: "ascending" | "descending" }>({ key: "spend", direction: "descending" });
  const [page, setPage] = useState(0);
  const column = columns.find((entry) => entry.key === sort.key) ?? columns[0];
  const sorted = sortRows(rows, column, sort.direction);
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const maxSpend = Math.max(...rows.map((row) => row.spend), 1);
  const lastPage = Math.max(0, Math.ceil(rows.length / PAGE_SIZE) - 1);

  function sortBy(next: Column) {
    const firstDirection = next.lowerIsBetter ? "ascending" : "descending";
    const flipped = sort.direction === "ascending" ? "descending" : "ascending";
    setSort({ key: next.key, direction: next.key === sort.key ? flipped : firstDirection });
    setPage(0);
  }

  const cell = (entry: Column, totalsRow: Totals) => {
    const value = entry.value(totalsRow);
    return value === null ? "—" : entry.format(value, currency);
  };

  return (
    <section className="cor-bay" aria-label="Campaigns">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">Campaigns</h2>
        <span className="cor-tag">{rows.length} campaigns · {source === "crm" ? "leads and deals from HubSpot" : "conversions are platform-reported"}</span>
      </div>
      <div className="cor-table-wrap">
        <table className="cor-table">
          <thead>
            <tr>
              <th scope="col">Campaign</th>
              {columns.map((entry) => (
                <th key={entry.key} scope="col" className="n" aria-sort={entry.key === sort.key ? sort.direction : undefined}>
                  <button type="button" onClick={() => sortBy(entry)}>
                    {entry.label}{entry.key === sort.key ? (sort.direction === "descending" ? " ▼" : " ▲") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id}>
                <td>{row.name}<span className="sub">{row.channelCode}</span></td>
                {columns.map((entry) => (
                  <td key={entry.key} className="n">
                    {cell(entry, row)}
                    {entry.key === "spend" && <> <span className="cor-minibar" style={{ "--w": `${Math.round((row.spend / maxSpend) * 48)}px`, background: channelColor(row.colorIndex) } as CSSProperties} /></>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>{rows.length} campaigns</td>
              {columns.map((entry) => <td key={entry.key} className="n">{cell(entry, totals)}</td>)}
            </tr>
          </tfoot>
        </table>
      </div>
      {rows.length > PAGE_SIZE && (
        <div className="cor-pager">
          <span className="cor-tag">Rows {page * PAGE_SIZE + 1}–{Math.min(rows.length, (page + 1) * PAGE_SIZE)} of {rows.length}</span>
          <span className="cor-row" style={{ gap: "var(--space-2)" }}>
            <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)} style={{ transform: "scaleX(-1)" }}><Icon name="chevron-right" /></button>
            <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label="Next page" disabled={page === lastPage} onClick={() => setPage(page + 1)}><Icon name="chevron-right" /></button>
          </span>
        </div>
      )}
    </section>
  );
}
