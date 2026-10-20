"use client";

import { useId, useRef, useState } from "react";
import { updateWorkspaceAction } from "@/app/(app)/settings/actions";
import { Banner } from "@/components/feedback/Banner";
import type { Workspace } from "@/lib/data";
import { CURRENCIES, TIME_ZONES, validateWorkspaceInput, type WorkspaceErrors } from "@/lib/data/settings-rules";
import type { WeekStart, WorkspaceInput } from "@/lib/data/settings-types";
import { Field } from "./Field";
import { SettingsSection } from "./SettingsSection";
import { useSectionSave } from "./useSectionSave";

interface WorkspaceFormProps {
  workspace: Workspace;
  canManage: boolean;
}

/** Workspace-wide settings: admins edit, members read. */
export function WorkspaceForm({ workspace, canManage }: WorkspaceFormProps) {
  const [input, setInput] = useState<WorkspaceInput>({ name: workspace.name, currency: workspace.currency, timeZone: workspace.timeZone, weekStart: workspace.weekStart });
  const [errors, setErrors] = useState<WorkspaceErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const weekGroup = useId();
  const { busy, saved, save, edited } = useSectionSave();
  const change = (patch: Partial<WorkspaceInput>) => { setInput((current) => ({ ...current, ...patch })); edited(); };

  function submit() {
    const found = validateWorkspaceInput(input);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    if (Object.keys(found).length > 0) return;
    save(() => updateWorkspaceAction({ ...input, name: input.name.trim() }), "Couldn't save workspace settings");
  }

  return (
    <>
      {!canManage && <Banner tone="info" icon="lock">Only admins can change workspace settings. They apply to everyone in {workspace.name}.</Banner>}
      <SettingsSection id="workspace" title="Workspace" tag="Everyone in the workspace" onSubmit={canManage ? submit : undefined} busy={busy} saved={saved}>
        <Field id="ws-name" label="Workspace name" error={errors.name}>
          <input ref={nameRef} className="cor-input" id="ws-name" value={input.name} disabled={!canManage} aria-invalid={errors.name ? true : undefined} aria-describedby="ws-name-help"
            onChange={(event) => change({ name: event.target.value })} onBlur={() => setErrors(validateWorkspaceInput(input))} />
        </Field>
        <Field id="ws-currency" label="Currency" error={errors.currency} help="Match your ad accounts' billing currency. COR shows amounts as reported; it doesn't convert.">
          <select className="cor-input" id="ws-currency" value={input.currency} disabled={!canManage} aria-describedby="ws-currency-help" onChange={(event) => change({ currency: event.target.value })}>
            {CURRENCIES.map((entry) => <option key={entry.code} value={entry.code}>{entry.code} · {entry.name}</option>)}
          </select>
        </Field>
        <Field id="ws-zone" label="Time zone" error={errors.timeZone} help="Where each day starts and ends, for every chart and alert.">
          <select className="cor-input" id="ws-zone" value={input.timeZone} disabled={!canManage} aria-describedby="ws-zone-help" onChange={(event) => change({ timeZone: event.target.value })}>
            {TIME_ZONES.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
          </select>
        </Field>
        <fieldset className="cor-settings-choices" disabled={!canManage}>
          <legend className="cor-tag">Week starts on</legend>
          <span className="cor-row" style={{ gap: "var(--space-6)" }}>
            {(["monday", "sunday"] as WeekStart[]).map((day) => (
              <label key={day} className="cor-check"><input type="radio" name={weekGroup} checked={input.weekStart === day} onChange={() => change({ weekStart: day })} /><span>{day === "monday" ? "Monday" : "Sunday"}</span></label>
            ))}
          </span>
          <span className="cor-help">Weekly charts and the weekly summary follow this.</span>
        </fieldset>
      </SettingsSection>
    </>
  );
}
