"use client";

import { useTransition } from "react";
import { deleteAlertAction, setAlertPausedAction } from "@/app/(app)/settings/actions";
import { useToast } from "@/components/feedback/Toaster";
import { HoldKey } from "@/components/ui/HoldKey";
import { Key } from "@/components/ui/Key";
import type { AlertRow } from "@/lib/data/settings-view";

interface AlertListProps {
  rows: AlertRow[];
  onEdit: (row: AlertRow) => void;
}

/** Saved alerts as sentences: pause with the switch, edit, or hold to delete. */
export function AlertList({ rows, onEdit }: AlertListProps) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();

  function setPaused(row: AlertRow, paused: boolean) {
    startTransition(async () => {
      const result = await setAlertPausedAction(row.id, paused);
      show(result.ok ? { tone: "ok", title: paused ? "Alert paused" : "Alert back on", detail: row.sentence } : { tone: "failed", title: "Couldn't change the alert", detail: result.message });
    });
  }

  function remove(row: AlertRow) {
    startTransition(async () => {
      const result = await deleteAlertAction(row.id);
      show(result.ok ? { tone: "ok", title: "Alert deleted", detail: row.sentence } : { tone: "failed", title: "Couldn't delete the alert", detail: result.message });
    });
  }

  return (
    <div className="cor-table-wrap">
      <table className="cor-table cor-alert-table">
        <colgroup><col className="cor-alert-table__state" /><col /><col className="cor-alert-table__fired" /><col className="cor-alert-table__actions" /></colgroup>
        <thead><tr><th scope="col">On</th><th scope="col">Alert</th><th scope="col">Last 30 days</th><th scope="col"><span className="cor-visually-hidden">Actions</span></th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                {row.canManage ? (
                  <label className="cor-switch">
                    <input type="checkbox" aria-label={row.rule.paused ? "Turn alert on" : "Pause alert"} checked={!row.rule.paused} disabled={busy} onChange={() => setPaused(row, !row.rule.paused)} />
                    <span className="cor-switch__state" aria-hidden="true">{row.rule.paused ? "OFF" : "ON"}</span>
                  </label>
                ) : <span className={row.rule.paused ? "cor-badge cor-badge--muted" : "cor-badge"}>{row.rule.paused ? "Off" : "On"}</span>}
              </td>
              <td><span className="cor-list__main"><strong className={row.rule.paused ? "cor-alert-table__paused" : undefined}>{row.sentence}</strong><span>{row.owner}</span></span></td>
              <td><span className="cor-tag">{row.fired}</span></td>
              <td className="n">
                {row.canManage && (
                  <span className="cor-row cor-alert-table__buttons">
                    <Key size="sm" onClick={() => onEdit(row)} disabled={busy}>Edit</Key>
                    <HoldKey size="sm" label="Hold to delete" holdLabel="Hold to delete this alert" onConfirm={() => remove(row)} disabled={busy} />
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
