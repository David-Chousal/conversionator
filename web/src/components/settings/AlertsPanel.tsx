"use client";

import { useState } from "react";
import { Key } from "@/components/ui/Key";
import { PLATFORMS } from "@/lib/data";
import { draftOf, emptyDraft } from "@/lib/data/alert-rules";
import type { AlertDraft, AlertSeries } from "@/lib/data/settings-types";
import type { AlertRow, FeedEntry } from "@/lib/data/settings-view";
import { AlertBuilder } from "./AlertBuilder";
import { AlertFeed } from "./AlertFeed";
import { AlertList } from "./AlertList";

interface AlertsPanelProps {
  alerts: AlertRow[];
  feed: FeedEntry[];
  series: AlertSeries;
  /** Admins can write workspace alerts. */
  canManage: boolean;
}

/** Settings › Alerts: the rule builder, saved rules and what fired recently. */
export function AlertsPanel({ alerts, feed, series, canManage }: AlertsPanelProps) {
  const [editing, setEditing] = useState<{ id: string | null; draft: AlertDraft; key: number } | null>(null);
  const platforms = PLATFORMS.map((entry) => entry.platform).filter((platform) => series.days.some((day) => day.platform === platform));
  const active = alerts.filter((row) => !row.rule.paused).length;

  return (
    <>
      <section className="cor-bay" aria-labelledby="alerts-title">
        <div className="cor-bay__head">
          <h2 className="cor-bay__title" id="alerts-title">{editing ? (editing.id ? "Edit alert" : "New alert") : "Alerts"}</h2>
          <span className="cor-row" style={{ gap: "var(--space-3)" }}>
            <span className="cor-tag">Checked every sync · {active} on</span>
            {!editing && <Key size="sm" variant="primary" icon="plus" onClick={() => setEditing({ id: null, draft: emptyDraft("personal"), key: Date.now() })}>New alert</Key>}
          </span>
        </div>
        {editing && (
          <AlertBuilder key={editing.key} initial={editing.draft} editingId={editing.id} series={series} platforms={platforms} canManageWorkspace={canManage} onClose={() => setEditing(null)} />
        )}
        {alerts.length > 0 ? (
          <AlertList rows={alerts} onEdit={(row) => setEditing({ id: row.id, draft: draftOf(row.rule), key: Date.now() })} />
        ) : !editing && <p className="cor-help">No alerts yet. Write one as a sentence and COR checks it every time data syncs.</p>}
      </section>
      <AlertFeed entries={feed} />
    </>
  );
}
