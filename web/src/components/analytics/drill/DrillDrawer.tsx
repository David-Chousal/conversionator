"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { toCsv } from "@/lib/analytics/csv";
import { buildDrill, drillCell, drillExport, type DrillRow, type DrillTarget } from "@/lib/analytics/drilldown";
import { analyticsHref } from "@/lib/analytics/filter";
import { DEFAULT_VIEW_ID } from "@/lib/analytics/layout";
import { metricLabel } from "@/lib/analytics/metrics";
import type { AnalyticsReport } from "@/lib/analytics/types";
import { Readout } from "../Readout";
import { channelColor } from "../color";
import { downloadText } from "./download";

interface DrillDrawerProps {
  report: AnalyticsReport;
  viewId?: string;
  target: DrillTarget;
  onNavigate: (target: DrillTarget) => void;
  onClose: () => void;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const NOUN = { channels: "channel", campaigns: "campaign", ads: "ad" } as const;
const HINT = {
  channels: "Select a channel to see its campaigns.",
  campaigns: "Select a campaign to see its ads.",
  ads: "Ads as HubSpot and the platform recorded them.",
} as const;

/** The rows behind a number: breadcrumbs, the scoped readout, contributors and totals. */
export function DrillDrawer({ report, viewId = DEFAULT_VIEW_ID, target, onNavigate, onClose }: DrillDrawerProps) {
  const router = useRouter();
  const view = buildDrill(report, target);
  const title = `${metricLabel(target.metric, report.attribution.source)} breakdown`;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const onCloseRef = useRef(onClose);
  const sortedColumn = view.columns.find((column) => column.key === target.metric) ?? view.columns[0];
  const noun = NOUN[view.level];
  const campaignName = target.campaignId ? report.campaignOptions.find((option) => option.id === target.campaignId)?.name : null;

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    headingRef.current?.focus();
  }, [target]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function select(row: DrillRow) {
    if (view.level === "channels") onNavigate({ ...target, platform: row.platform, campaignId: null });
    if (view.level === "campaigns") onNavigate({ ...target, campaignId: row.id });
  }

  function filterToCampaign() {
    if (!target.campaignId) return;
    router.replace(analyticsHref({ ...report.filter, campaignId: target.campaignId }, report.today, viewId), { scroll: false });
    onClose();
  }

  function exportRows() {
    const { headers, rows } = drillExport(view);
    downloadText(`cor-${target.metric}-${view.level}-${report.filter.from}-${report.filter.to}.csv`, toCsv(headers, rows));
  }

  return (
    <aside className="cor-drawer cor-drawer--fixed" aria-label={title}>
      <div className="cor-drawer__head">
        <nav className="cor-crumbs" aria-label="Breakdown path">
          {view.crumbs.map((crumb, i) => (
            <span key={crumb.label} className="cor-row" style={{ gap: 6 }}>
              {i > 0 && <span aria-hidden="true">›</span>}
              {crumb.target === "current"
                ? <span aria-current="page">{crumb.label}</span>
                : <button type="button" className="cor-crumbs__link" onClick={() => crumb.target !== "current" && onNavigate({ ...target, ...crumb.target })}>{crumb.label}</button>}
            </span>
          ))}
        </nav>
        <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label="Close breakdown" onClick={onClose}><Icon name="close" /></button>
      </div>
      <h2 ref={headingRef} tabIndex={-1} className="cor-drawer__title">{title}</h2>
      <Readout data={view.readout} currency={report.currency} windowDays={view.windowDays} scope={view.scopeLabel} />
      {view.rows.length === 0 ? (
        <p className="cor-help">No spend or conversions in this scope.</p>
      ) : (
        <>
          <span className="cor-tag">{view.level === "ads" && report.attribution.source !== "crm" ? "Ads as each platform reported them." : HINT[view.level]}</span>
          <div className="cor-table-wrap">
            <table className="cor-table">
              <thead>
                <tr>
                  <th scope="col">{view.level === "channels" ? "Channel" : view.level === "campaigns" ? "Campaign" : "Ad"}</th>
                  {view.columns.map((column) => (
                    <th key={column.key} scope="col" className="n" aria-sort={column.key === sortedColumn.key ? (target.metric === "cpa" ? "ascending" : "descending") : undefined}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {view.rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.drillable ? (
                        <button type="button" className="cor-drill-row" aria-label={`Show ${row.name} ${view.level === "channels" ? "campaigns" : "ads"}`} onClick={() => select(row)}>
                          <i style={{ background: channelColor(row.colorIndex) }} />
                          <span>{row.name}<span className="sub">{row.sub}</span></span>
                          <Icon name="chevron-right" />
                        </button>
                      ) : (
                        <span className="cor-drill-row cor-drill-row--static">
                          <i style={{ background: channelColor(row.colorIndex) }} />
                          <span>{row.name}<span className="sub">{row.sub}</span></span>
                        </span>
                      )}
                    </td>
                    {view.columns.map((column) => <td key={column.key} className="n">{drillCell(column.key, row.totals, view.totals, report.currency, target.metric)}</td>)}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>{plural(view.rows.length, noun)}</td>
                  {view.columns.map((column) => <td key={column.key} className="n">{drillCell(column.key, view.totals, view.totals, report.currency, target.metric)}</td>)}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
      <div className="cor-row" style={{ gap: "var(--space-3)" }}>
        <button type="button" className="cor-key cor-key--sm" onClick={exportRows} disabled={view.rows.length === 0}><Icon name="export" />Export rows</button>
        {campaignName && <button type="button" className="cor-key cor-key--sm" aria-label={`Filter the board to ${campaignName}`} onClick={filterToCampaign}><Icon name="filter" />Filter board to this campaign</button>}
        {target.platform && <Link className="cor-link" href={`/data?platform=${target.platform}`}>Open in Data →</Link>}
      </div>
    </aside>
  );
}
