"use client";

import { useId, useState, useTransition } from "react";
import { saveAlertAction } from "@/app/(app)/settings/actions";
import { useToast } from "@/components/feedback/Toaster";
import { Icon } from "@/components/ui/Icon";
import { Key } from "@/components/ui/Key";
import type { Platform } from "@/lib/data";
import { evaluateAlert } from "@/lib/data/alert-evaluate";
import { validateAlertDraft } from "@/lib/data/alert-rules";
import { alertSentence } from "@/lib/data/alert-text";
import type { AlertDraft, AlertField, AlertRule, AlertSeries } from "@/lib/data/settings-types";
import { AlertSentence } from "./AlertSentence";

interface AlertBuilderProps {
  initial: AlertDraft;
  editingId: string | null;
  series: AlertSeries;
  platforms: Platform[];
  canManageWorkspace: boolean;
  onClose: () => void;
}

const BACKTEST_DAYS = 30;

function backtest(draft: AlertDraft, series: AlertSeries): string {
  const count = evaluateAlert({ ...(draft as AlertRule), id: "draft", slackChannel: null, ownerId: "", ownerName: "", paused: false, createdAt: "" }, series.days, series.today, BACKTEST_DAYS).length;
  if (count === 0) return `Wouldn't have fired in the last ${BACKTEST_DAYS} days`;
  return `Would have fired ${count === 1 ? "once" : `${count} times`} in the last ${BACKTEST_DAYS} days`;
}

/** An alert written as a sentence: each slot is a select or a number, and Save waits until every slot is valid. */
export function AlertBuilder({ initial, editingId, series, platforms, canManageWorkspace, onClose }: AlertBuilderProps) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();
  const [draft, setDraft] = useState(initial);
  const [thresholdText, setThresholdText] = useState(initial.threshold === null ? "" : String(initial.threshold));
  const [touched, setTouched] = useState<Set<AlertField>>(new Set());
  const scopeGroup = useId();
  const hasCrm = series.source === "crm";
  const errors = validateAlertDraft(draft, { hasCrm });
  const complete = Object.keys(errors).length === 0;
  const shown = (Object.keys(errors) as AlertField[]).filter((field) => touched.has(field));
  const personal = draft.scope === "personal";

  const set = (patch: Partial<AlertDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const touch = (field: AlertField) => setTouched((current) => new Set(current).add(field));

  function leaveSlack() {
    const name = draft.slackChannel.trim().toLowerCase();
    if (name && !name.startsWith("#")) set({ slackChannel: `#${name}` });
    touch("slackChannel");
  }

  function save() {
    startTransition(async () => {
      const result = await saveAlertAction(editingId, { ...draft, slackChannel: draft.slackChannel.trim() });
      if (!result.ok) return show({ tone: "failed", title: "Couldn't save the alert", detail: result.message });
      show({ tone: "ok", title: "Alert saved", detail: alertSentence(result.data, series) });
      onClose();
    });
  }

  return (
    <div className="cor-alert-builder">
      <AlertSentence draft={draft} thresholdText={thresholdText} invalid={shown} series={series} platforms={platforms}
        onChange={set} onThreshold={(text) => { setThresholdText(text); set({ threshold: text === "" ? null : Number(text) }); }} onLeave={touch} onLeaveSlack={leaveSlack} />
      {shown.length > 0 && <span className="cor-help cor-help--error" role="alert"><Icon name="warning" />{shown.map((field) => errors[field]).join(" ")}</span>}
      {canManageWorkspace ? (
        <fieldset className="cor-settings-choices">
          <legend className="cor-tag">Who it&apos;s for</legend>
          <span className="cor-row" style={{ gap: "var(--space-6)" }}>
            <label className="cor-check"><input type="radio" name={scopeGroup} checked={personal} onChange={() => set({ scope: "personal" })} /><span>Just me</span></label>
            <label className="cor-check"><input type="radio" name={scopeGroup} checked={!personal} onChange={() => set({ scope: "workspace" })} /><span>Everyone in the workspace</span></label>
          </span>
        </fieldset>
      ) : <span className="cor-help">Personal alert · only you get it.</span>}
      <div className="cor-row" style={{ gap: "var(--space-2)", flexWrap: "wrap" }}>
        <Key variant="primary" onClick={save} disabled={busy || !complete}>Save alert</Key>
        <Key onClick={onClose}>Cancel</Key>
        <span className="cor-tag">{complete ? backtest(draft, series) : "Fill every slot to see how often it would fire"}</span>
      </div>
    </div>
  );
}
