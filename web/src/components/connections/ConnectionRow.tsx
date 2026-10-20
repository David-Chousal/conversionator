"use client";

import Link from "next/link";
import { useTransition, type CSSProperties } from "react";
import { syncNowAction } from "@/app/(app)/connections/actions";
import { useToast } from "@/components/feedback/Toaster";
import { ActionMenu, type ActionMenuItem } from "@/components/overlays/ActionMenu";
import { SignalMeter } from "@/components/status/SignalMeter";
import { Icon } from "@/components/ui/Icon";
import { Key } from "@/components/ui/Key";
import type { ConnectionRowView } from "@/lib/data/connections-view";
import { formatCount } from "@/lib/format";
import { PlatformMark } from "./PlatformMark";

interface ConnectionRowProps {
  row: ConnectionRowView;
  canManage: boolean;
  onDisconnect: (row: ConnectionRowView) => void;
}

function SignalCell({ row }: { row: ConnectionRowView }) {
  const { connection, signal } = row;
  if (connection.status === "available") return <span className="cor-tag">Not connected</span>;
  if (connection.syncProgress) {
    const { percent, rows } = connection.syncProgress;
    return (
      <span className="cor-progress">
        <span className="cor-progress__track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`First sync of ${connection.name}`}>
          <b style={{ "--p": `${percent}%` } as CSSProperties} />
        </span>
        <span className="cor-tag">{percent}% · {formatCount(rows)} rows</span>
      </span>
    );
  }
  return (
    <span className="cor-conn__health">
      <SignalMeter state={signal.state} lit={signal.lit} word={signal.word} age={signal.age} />
      {row.timing && <span className="cor-tag">{row.timing}</span>}
    </span>
  );
}

export function ConnectionRow({ row, canManage, onDisconnect }: ConnectionRowProps) {
  const { connection, account, monogram } = row;
  const { show } = useToast();
  const [syncing, startSync] = useTransition();
  const available = connection.status === "available";
  const reconnectHref = `/oauth/${connection.platform}?mode=reconnect&connection=${connection.id}`;

  function syncNow() {
    startSync(async () => {
      const result = await syncNowAction(connection.id);
      show(
        result.ok
          ? { tone: "ok", title: `Synced ${formatCount(result.data.rows)} rows from ${connection.name}`, detail: "Dashboards are up to date." }
          : { tone: "failed", title: `${connection.name} didn't sync`, detail: result.message },
      );
    });
  }

  const menuItems: ActionMenuItem[] = [
    ...(connection.status === "connected" ? [{ label: "Sync now", icon: "sync" as const, onSelect: syncNow }] : []),
    { label: "Manage datasets", icon: "data", href: `/data?source=${connection.id}` },
    { label: "Disconnect", icon: "close", danger: true, onSelect: () => onDisconnect(row) },
  ];

  function actions() {
    if (available) {
      return <Link className="cor-key cor-key--sm" href={`/oauth/${connection.platform}?mode=connect`}><Icon name="plus" />Connect</Link>;
    }
    if (connection.status === "syncing") return <Key size="sm" disabled>Syncing…</Key>;
    // Only revoked access needs a person; everything else recovers on the hourly schedule.
    return (
      <>
        {connection.status === "failed" ? (
          <Link className="cor-key cor-key--sm cor-key--primary" href={reconnectHref}>Reconnect</Link>
        ) : (
          <Key size="sm" icon="sync" onClick={syncNow} disabled={syncing} aria-busy={syncing} className={syncing ? "is-busy" : undefined}>
            {syncing ? "Syncing…" : "Sync now"}
          </Key>
        )}
        <ActionMenu label={`${connection.name} actions`} items={menuItems} />
      </>
    );
  }

  return (
    <div className="cor-list__row cor-conn">
      <PlatformMark monogram={monogram} muted={available} />
      <span className="cor-list__main cor-conn__main">
        <strong>{connection.name} {connection.channelCode && <span className="cor-tag">{connection.channelCode}</span>}</strong>
        <span className={`cor-conn__account cor-conn__account--${account.tone}`}>{account.text}</span>
      </span>
      <span className="cor-conn__signal"><SignalCell row={row} /></span>
      <span className="cor-conn__datasets cor-num">
        {available || connection.syncProgress ? "—" : `${connection.datasets.enabled} of ${connection.datasets.total}`}
      </span>
      <span className="cor-list__end cor-conn__actions">{canManage && actions()}</span>
    </div>
  );
}
