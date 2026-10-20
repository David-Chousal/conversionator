"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectAction } from "@/app/(app)/connections/actions";
import { Banner } from "@/components/feedback/Banner";
import { useToast } from "@/components/feedback/Toaster";
import { Dialog } from "@/components/overlays/Dialog";
import { HoldKey } from "@/components/ui/HoldKey";
import { Key } from "@/components/ui/Key";
import type { ConnectionRowView } from "@/lib/data/connections-view";
import { ConnectionRow } from "./ConnectionRow";

export type ConnectionsNotice =
  | { kind: "connected" | "reconnected"; platformName: string }
  | { kind: "cancelled"; platformName: string }
  | { kind: "failed"; platformName: string; reason: string };

interface ConnectionsBoardProps {
  connected: ConnectionRowView[];
  available: ConnectionRowView[];
  canManage: boolean;
  notice?: ConnectionsNotice;
}

const FIRST_SYNC_POLL_MS = 2000;
const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

function RowsHead() {
  return (
    <div className="cor-list__row cor-list__row--head cor-conn cor-conn--head" aria-hidden="true">
      <span />
      <span className="cor-tag">Platform</span>
      <span className="cor-tag">Signal</span>
      <span className="cor-tag">Datasets</span>
      <span />
    </div>
  );
}

function Section({ id, title, tag, children }: { id?: string; title: string; tag: string; children: React.ReactNode }) {
  const headingId = useId();
  return (
    <section className="cor-bay" id={id} aria-labelledby={headingId}>
      <div className="cor-bay__head">
        <h2 className="cor-bay__title" id={headingId}>{title}</h2>
        <span className="cor-tag">{tag}</span>
      </div>
      <div className="cor-list">
        <RowsHead />
        {children}
      </div>
    </section>
  );
}

/** Refreshes the page while any first sync runs, so its progress moves. */
function useFirstSyncPolling(rows: ConnectionRowView[]) {
  const router = useRouter();
  const anySyncing = rows.some((row) => row.connection.syncProgress);
  useEffect(() => {
    if (!anySyncing) return;
    const timer = setInterval(() => router.refresh(), FIRST_SYNC_POLL_MS);
    return () => clearInterval(timer);
  }, [anySyncing, router]);
}

/** Shows the result of the platform sign-in once, then cleans the URL. */
function useSignInNotice(notice: ConnectionsNotice | undefined) {
  const router = useRouter();
  const { show } = useToast();
  const handled = useRef(false);
  useEffect(() => {
    if (!notice || handled.current) return;
    handled.current = true;
    if (notice.kind === "connected") show({ tone: "ok", title: `Connected ${notice.platformName}`, detail: "Pulling the last 90 days. This takes a moment." });
    if (notice.kind === "reconnected") show({ tone: "ok", title: `Reconnected ${notice.platformName}`, detail: "Syncing resumed." });
    router.replace("/connections", { scroll: false });
  }, [notice, router, show]);
}

export function ConnectionsBoard({ connected, available, canManage, notice }: ConnectionsBoardProps) {
  const { show } = useToast();
  const [target, setTarget] = useState<ConnectionRowView | null>(null);
  const [problem] = useState(notice?.kind === "cancelled" || notice?.kind === "failed" ? notice : null);
  const [disconnecting, startDisconnect] = useTransition();
  useFirstSyncPolling(connected);
  useSignInNotice(notice);

  function disconnect(row: ConnectionRowView) {
    const { connection } = row;
    startDisconnect(async () => {
      const result = await disconnectAction(connection.id);
      setTarget(null);
      show(
        result.ok
          ? { tone: "ok", title: `Disconnected ${connection.name}`, detail: `Deleted its ${connection.datasets.enabled} datasets from COR.` }
          : { tone: "failed", title: `Couldn't disconnect ${connection.name}`, detail: result.message },
      );
    });
  }

  return (
    <>
      {!canManage && (
        <Banner tone="info" icon="lock">Only admins can connect, reconnect or disconnect platforms. Ask an admin to make changes.</Banner>
      )}
      {problem?.kind === "cancelled" && (
        <Banner><strong>{problem.platformName} wasn&apos;t connected.</strong> You cancelled at the {problem.platformName} sign-in.</Banner>
      )}
      {problem?.kind === "failed" && (
        <Banner tone="failed"><strong>{problem.platformName} wasn&apos;t connected.</strong> {problem.reason}</Banner>
      )}

      <Section title="Connected" tag={`${plural(connected.length, "channel")} · signal and datasets`}>
        {connected.map((row) => <ConnectionRow key={row.connection.id} row={row} canManage={canManage} onDisconnect={setTarget} />)}
      </Section>

      {available.length > 0 && (
        <Section id="available" title="Available" tag={plural(available.length, "platform")}>
          {available.map((row) => <ConnectionRow key={row.connection.id} row={row} canManage={canManage} onDisconnect={setTarget} />)}
        </Section>
      )}

      <p className="cor-help" style={{ margin: 0 }}>
        Looking for HubSpot? CRMs aren&apos;t ad platforms: connect yours in <Link className="cor-link" href="/settings?tab=crm">Settings › CRM</Link> to attribute leads and deals to these channels.
      </p>

      <Dialog
        open={target !== null}
        title={target ? `Disconnect ${target.connection.name}?` : ""}
        onClose={() => setTarget(null)}
        footer={target && (
          <>
            <Key onClick={() => setTarget(null)} shortcut="Esc">Cancel</Key>
            <HoldKey label="Hold to disconnect" holdLabel={`Hold to disconnect ${target.connection.name}`} onConfirm={() => disconnect(target)} disabled={disconnecting} />
          </>
        )}
      >
        {target && (
          <p style={{ margin: 0 }}>
            COR stops syncing {target.connection.name} ({target.connection.channelCode}) and deletes the {target.connection.datasets.enabled} datasets
            it stored. Dashboards and reports lose its numbers. You can connect it again later; COR re-syncs the last 90 days, and it gets a new channel code.
          </p>
        )}
      </Dialog>
    </>
  );
}
