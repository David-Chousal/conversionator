"use client";

import Link from "next/link";
import { useState, useTransition, type CSSProperties } from "react";
import { disconnectCrmAction, syncCrmAction, updateLeadStageAction } from "@/app/(app)/settings/actions";
import { PlatformMark } from "@/components/connections/PlatformMark";
import { Banner } from "@/components/feedback/Banner";
import { useToast } from "@/components/feedback/Toaster";
import { ActionMenu } from "@/components/overlays/ActionMenu";
import { Dialog } from "@/components/overlays/Dialog";
import { SignalMeter } from "@/components/status/SignalMeter";
import { HoldKey } from "@/components/ui/HoldKey";
import { Icon } from "@/components/ui/Icon";
import { Key } from "@/components/ui/Key";
import { LEAD_STAGE_NAMES, crmRecordsLine } from "@/lib/data/crm-view";
import type { Signal } from "@/lib/data/sync";
import type { CrmConnection, LeadStage } from "@/lib/data/types";
import { formatCount } from "@/lib/format";

interface CrmPanelProps {
  crm: CrmConnection;
  signal: Signal;
  /** "Auto · next in 48m" while on the hourly schedule. */
  timing?: string | null;
  canManage: boolean;
}

function StatusCell({ crm, signal, timing }: { crm: CrmConnection; signal: Signal; timing?: string | null }) {
  if (!crm.syncProgress) {
    return (
      <span className="cor-conn__health">
        <SignalMeter state={signal.state} lit={signal.lit} word={signal.word} age={signal.age} />
        {timing && <span className="cor-tag">{timing}</span>}
      </span>
    );
  }
  const { percent, rows } = crm.syncProgress;
  return (
    <span className="cor-progress">
      <span className="cor-progress__track" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="First sync of HubSpot">
        <b style={{ "--p": `${percent}%` } as CSSProperties} />
      </span>
      <span className="cor-tag">{percent}% · {formatCount(rows)} contacts</span>
    </span>
  );
}

function AttributionSettings({ crm, canManage, onLeadStage }: { crm: CrmConnection; canManage: boolean; onLeadStage: (stage: LeadStage) => void }) {
  return (
    <div className="cor-crm__settings">
      <label className="cor-fieldset">
        <span className="cor-fieldset__label"><span className="cor-tag">Count a lead at</span><span className="cor-tag">Lifecycle stage</span></span>
        <select className="cor-input" id="crm-lead-stage" aria-label="Count a lead at" value={crm.leadStage} disabled={!canManage} onChange={(event) => onLeadStage(event.target.value as LeadStage)}>
          {(Object.keys(LEAD_STAGE_NAMES) as LeadStage[]).map((stage) => <option key={stage} value={stage}>{LEAD_STAGE_NAMES[stage]}</option>)}
        </select>
        <span className="cor-help">Contacts count as leads once they reach this stage in HubSpot.</span>
      </label>
      <label className="cor-fieldset">
        <span className="cor-fieldset__label"><span className="cor-tag">Count a conversion at</span></span>
        <input className="cor-input" id="crm-deal-stage" value="Deal stage · Closed won" readOnly />
        <span className="cor-help">A conversion is a deal marked closed won; its amount is the revenue.</span>
      </label>
      <label className="cor-fieldset">
        <span className="cor-fieldset__label"><span className="cor-tag">Attribution model</span></span>
        <input className="cor-input" id="crm-model" value="Last ad interaction" readOnly />
        <span className="cor-help">Each lead and deal is credited to the last ad the contact clicked before converting. Contacts who never clicked an ad stay unattributed.</span>
      </label>
    </div>
  );
}

/** HubSpot as the CRM that attributes leads, deals and revenue to ads. Lives in Settings, not Connections. */
export function CrmPanel({ crm, signal, timing, canManage }: CrmPanelProps) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const available = crm.status === "available";
  const failed = crm.status === "failed";

  function run<T>(action: () => Promise<{ ok: true; data: T } | { ok: false; message: string }>, success: (data: T) => { title: string; detail?: string }, failure: string) {
    startTransition(async () => {
      const result = await action();
      show(result.ok ? { tone: "ok", ...success(result.data) } : { tone: "failed", title: failure, detail: result.message });
    });
  }

  const sync = () => run(syncCrmAction, (data) => ({ title: `Synced ${formatCount(data.rows)} HubSpot records`, detail: "Attribution is up to date." }), "HubSpot didn't sync");
  const setLeadStage = (stage: LeadStage) => run(() => updateLeadStageAction(stage), () => ({ title: `Leads now count at ${LEAD_STAGE_NAMES[stage]}`, detail: "Analytics uses the new definition." }), "Couldn't change the lead stage");
  const disconnect = () => {
    setConfirming(false);
    run(disconnectCrmAction, () => ({ title: "Disconnected HubSpot", detail: "Analytics now shows platform-reported conversions." }), "Couldn't disconnect HubSpot");
  };

  return (
    <section className="cor-bay" id="crm" aria-labelledby="crm-title">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title" id="crm-title">CRM &amp; attribution</h2>
        <span className="cor-tag">Leads and deals for every ad</span>
      </div>
      <p className="cor-help" style={{ margin: 0, maxWidth: "70ch" }}>
        Your CRM isn&apos;t an ad platform. COR reads its contacts and deals to tell which platform, campaign and ad produced each lead and sale, replacing the numbers each platform reports about itself.
      </p>
      {!canManage && <Banner tone="info" icon="lock">Only admins can change the CRM connection and attribution settings.</Banner>}
      {failed && <Banner tone="failed"><strong>HubSpot stopped syncing.</strong> {crm.failureReason ?? "Reconnect to resume."}</Banner>}
      <div className="cor-list">
        <div className="cor-list__row cor-crm__row">
          <PlatformMark monogram="H" muted={available} />
          <span className="cor-list__main">
            <strong>HubSpot <span className="cor-tag">CRM</span></strong>
            <span>{available ? crm.account : `${crm.account} · ${crmRecordsLine(crm)}`}</span>
          </span>
          <span><StatusCell crm={crm} signal={signal} timing={timing} /></span>
          <span className="cor-list__end">
            {canManage && available && <Link className="cor-key cor-key--sm cor-key--primary" href="/oauth/hubspot?mode=connect"><Icon name="plus" />Connect HubSpot</Link>}
            {canManage && failed && <Link className="cor-key cor-key--sm cor-key--primary" href="/oauth/hubspot?mode=reconnect">Reconnect</Link>}
            {canManage && crm.status === "connected" && (
              <Key size="sm" icon="sync" onClick={sync} disabled={busy} aria-busy={busy} className={busy ? "is-busy" : undefined}>{busy ? "Syncing…" : "Sync now"}</Key>
            )}
            {canManage && !available && crm.status !== "syncing" && (
              <ActionMenu label="HubSpot actions" items={[{ label: "Disconnect", icon: "close", danger: true, onSelect: () => setConfirming(true) }]} />
            )}
          </span>
        </div>
      </div>
      {!available && <AttributionSettings crm={crm} canManage={canManage} onLeadStage={setLeadStage} />}
      <Dialog
        open={confirming}
        title="Disconnect HubSpot?"
        onClose={() => setConfirming(false)}
        footer={<><Key onClick={() => setConfirming(false)} shortcut="Esc">Cancel</Key><HoldKey label="Hold to disconnect" holdLabel="Hold to disconnect HubSpot" onConfirm={disconnect} disabled={busy} /></>}
      >
        <p style={{ margin: 0 }}>
          COR deletes the {formatCount(crm.records.contacts)} contacts and {formatCount(crm.records.deals)} deals it stored from HubSpot. Analytics goes back to platform-reported conversions, which can double count across platforms.
        </p>
      </Dialog>
    </section>
  );
}
