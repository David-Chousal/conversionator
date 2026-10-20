"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeSourceAction, syncSourceAction } from "@/app/(app)/data/actions";
import { Banner } from "@/components/feedback/Banner";
import { useToast } from "@/components/feedback/Toaster";
import { ActionMenu, type ActionMenuItem } from "@/components/overlays/ActionMenu";
import { Dialog } from "@/components/overlays/Dialog";
import { SignalMeter } from "@/components/status/SignalMeter";
import { HoldKey } from "@/components/ui/HoldKey";
import { Key } from "@/components/ui/Key";
import type { SourceItem } from "@/lib/data/data-sources-view";
import { formatCount } from "@/lib/format";

interface SourceDetailProps {
  source: SourceItem;
  canManage: boolean;
  /** Records stored across the source's datasets, for the removal warning. */
  totalRecords: number;
}

/** The selected source: its health, Sync now, Reconnect when it failed, and removal. */
export function SourceDetail({ source, canManage, totalRecords }: SourceDetailProps) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const crm = source.kind === "crm";
  const reconnectHref = crm ? "/oauth/hubspot?mode=reconnect" : `/oauth/${source.platform}?mode=reconnect&connection=${source.id}`;

  function sync() {
    startTransition(async () => {
      const result = await syncSourceAction(source.id);
      show(result.ok
        ? { tone: "ok", title: `Synced ${formatCount(result.data.rows)} rows from ${source.name}`, detail: "Datasets and dashboards are up to date." }
        : { tone: "failed", title: `${source.name} didn't sync`, detail: result.message });
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await removeSourceAction(source.id);
      setConfirming(false);
      if (!result.ok) return show({ tone: "failed", title: `Couldn't remove ${source.name}`, detail: result.message });
      router.replace("/data", { scroll: false });
      show({ tone: "ok", title: `Removed ${source.name}`, detail: `Deleted ${formatCount(totalRecords)} stored records.` });
    });
  }

  const menu: ActionMenuItem[] = [
    ...(crm ? [{ label: "Attribution settings", icon: "settings" as const, href: "/settings?tab=crm" }] : [{ label: "Open in Connections", icon: "connections" as const, href: "/connections" }]),
    { label: "Remove data source", icon: "close", danger: true, onSelect: () => setConfirming(true) },
  ];

  return (
    <section className="cor-bay" aria-label={source.name}>
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">{source.name} <span className="cor-tag">{source.code}</span></h2>
        <SignalMeter state={source.signal.state} lit={source.signal.lit} word={source.signal.word} age={source.signal.age} />
      </div>
      {source.failed && (
        <Banner tone="failed" action={canManage ? <Link className="cor-key cor-key--sm cor-key--primary" href={reconnectHref}>Reconnect</Link> : undefined}>
          <strong>{source.name} stopped syncing.</strong> {source.account.text}
        </Banner>
      )}
      <div className="cor-row" style={{ justifyContent: "space-between" }}>
        <span className="cor-help">{source.failed ? "Records below are from the last successful sync." : [source.account.text, source.timing ?? "Syncs automatically every hour"].join(" · ")}</span>
        {canManage && (
          <span className="cor-row" style={{ gap: "var(--space-2)" }}>
            {!source.failed && !source.syncing && <Key size="sm" icon="sync" onClick={sync} disabled={busy} aria-busy={busy} className={busy ? "is-busy" : undefined}>{busy ? "Syncing…" : "Sync now"}</Key>}
            <ActionMenu label={`${source.name} actions`} items={menu} />
          </span>
        )}
      </div>
      <Dialog open={confirming} title={`Remove ${source.name}?`} onClose={() => setConfirming(false)}
        footer={<><Key onClick={() => setConfirming(false)} shortcut="Esc">Cancel</Key><HoldKey label="Hold to remove" holdLabel={`Hold to remove ${source.name}`} onConfirm={remove} disabled={busy} /></>}>
        <p style={{ margin: 0 }}>
          COR stops syncing {source.name} and deletes the {formatCount(totalRecords)} records it stored.{" "}
          {crm ? "Analytics goes back to platform-reported conversions." : "Its channel leaves Analytics; connecting it again re-syncs the last 90 days."}
        </p>
      </Dialog>
    </section>
  );
}
