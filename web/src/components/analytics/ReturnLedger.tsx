import type { CSSProperties } from "react";
import type { LedgerRow } from "@/lib/analytics/types";
import { formatMoney, formatRoas } from "@/lib/format";
import { channelColor } from "./color";
import { DrillButton } from "./drill/DrillButton";

interface ReturnLedgerProps {
  rows: LedgerRow[];
  currency: string;
  rangeLabel: string;
  /** Where the return side comes from, e.g. "HubSpot closed-won revenue". */
  revenueLabel: string;
  /** Let each channel name open its campaigns in the drill-down drawer. */
  drill?: boolean;
}

// The spend track is 1.6fr and the return track 4fr, so spend widths use 40% of the return scale.
const SPEND_TRACK_RATIO = 0.4;
const HEADROOM = 1.08;
const LABEL_INSIDE_AT = 0.8;

const width = (fraction: number) => ({ "--w": `${(fraction * 100).toFixed(2)}%` }) as CSSProperties;

/** Spend runs left of the spine and attributed return runs right, on one dollar scale. */
export function ReturnLedger({ rows, currency, rangeLabel, revenueLabel, drill = false }: ReturnLedgerProps) {
  const scale = Math.max(...rows.map((row) => Math.max(row.revenue, row.spend / SPEND_TRACK_RATIO)), 1) * HEADROOM;
  const roas = rows.map((row) => (row.spend > 0 ? row.revenue / row.spend : 0));
  const best = Math.max(...roas);
  const spend = rows.reduce((sum, row) => sum + row.spend, 0);
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  return (
    <section className="cor-bay" aria-label="Return ledger">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">Return ledger</h2>
        <span className="cor-tag">{rangeLabel} · {revenueLabel}</span>
      </div>
      <div className="cor-ledger" role="table" aria-label="Spend and attributed revenue by channel">
        <span role="row" style={{ display: "contents" }}>
          <span role="columnheader" aria-label="Channel" />
          <span role="columnheader" className="cor-tag" style={{ textAlign: "right", paddingRight: "var(--space-2)" }}>← Spent</span>
          <span role="columnheader" className="cor-tag" style={{ paddingLeft: "var(--space-2)" }}>Returned →</span>
          <span role="columnheader" className="cor-tag" style={{ textAlign: "right" }}>ROAS</span>
        </span>
        {rows.map((row, i) => {
          const returnFraction = row.revenue / scale;
          return (
            <span role="row" key={row.platform} style={{ display: "contents" }}>
              <span role="cell" className="cor-ledger__name">
                {drill ? (
                  <DrillButton target={{ metric: "roas", platform: row.platform, campaignId: null, bucket: null }} label={`Open ${row.name} ROAS breakdown`} className="cor-ledger__drill">
                    <i style={{ background: channelColor(row.colorIndex) }} />{row.name}
                  </DrillButton>
                ) : (
                  <><i style={{ background: channelColor(row.colorIndex) }} />{row.name}</>
                )}
              </span>
              <span role="cell" className="cor-ledger__spend" style={width(row.spend / (scale * SPEND_TRACK_RATIO))}><b /><em>{money(row.spend)}</em></span>
              <span role="cell" className="cor-ledger__ret" style={width(returnFraction)}>
                <b style={{ background: channelColor(row.colorIndex) }} />
                <em className={returnFraction > LABEL_INSIDE_AT ? "in" : undefined}>{money(row.revenue)}</em>
              </span>
              <span role="cell" className={roas[i] === best && rows.length > 1 ? "cor-ledger__roas is-best" : "cor-ledger__roas"}>{formatRoas(roas[i])}</span>
            </span>
          );
        })}
      </div>
      <span className="cor-tag">Total · spent {money(spend)} · returned {money(revenue)} · {formatRoas(spend > 0 ? revenue / spend : 0)}</span>
    </section>
  );
}
