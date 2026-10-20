"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteReportAction } from "@/app/(app)/reports/actions";
import { useToast } from "@/components/feedback/Toaster";
import { HoldKey } from "@/components/ui/HoldKey";
import { Icon } from "@/components/ui/Icon";
import type { ReportRow } from "@/lib/reports/view";

/** Saved and scheduled reports, with fixed columns so schedules and formats line up. */
export function ReportList({ rows }: { rows: ReportRow[] }) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();

  function remove(row: ReportRow) {
    startTransition(async () => {
      const result = await deleteReportAction(row.id);
      show(result.ok ? { tone: "ok", title: `Deleted ${row.name}`, detail: row.schedule ? "Its recipients won't get it anymore." : undefined } : { tone: "failed", title: "Couldn't delete the report", detail: result.message });
    });
  }

  return (
    <div className="cor-table-wrap">
      <table className="cor-table cor-report-table">
        <colgroup><col /><col className="cor-report-table__schedule" /><col className="cor-report-table__format" /><col className="cor-report-table__owner" /><col className="cor-report-table__actions" /></colgroup>
        <thead><tr><th scope="col">Report</th><th scope="col">Schedule</th><th scope="col">Format</th><th scope="col">Owner</th><th scope="col"><span className="cor-visually-hidden">Actions</span></th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <span className="cor-list__main">
                  <strong><Link className="cor-report-table__name" href={`/reports/${row.id}`}>{row.name}</Link></strong>
                  <span>{row.contents}</span>
                  {row.issue && <span className="cor-help cor-help--error">{row.issue}</span>}
                </span>
              </td>
              <td>
                <span className="cor-report-table__when">
                  {row.schedule ? <span className="cor-badge"><Icon name="calendar" />{row.schedule}</span> : <span className="cor-badge cor-badge--muted">One-off</span>}
                  <span className="cor-tag">{row.next}</span>
                </span>
              </td>
              <td><span className="cor-tag">{row.format}</span></td>
              <td><span className="cor-tag">{row.owner}</span></td>
              <td className="n">{row.canEdit && <HoldKey size="sm" label="Hold to delete" holdLabel={`Hold to delete ${row.name}`} onConfirm={() => remove(row)} disabled={busy} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
