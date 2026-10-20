"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { updateProfileAction } from "@/app/(app)/settings/actions";
import type { RangeDays, User, Workspace } from "@/lib/data";
import { CURRENCIES, RANGE_DAYS, TIME_ZONES, validateProfile, type ProfileErrors } from "@/lib/data/settings-rules";
import { Field } from "./Field";
import { SettingsSection } from "./SettingsSection";
import { useSectionSave } from "./useSectionSave";

interface GeneralFormProps {
  user: User;
  defaultRangeDays: RangeDays;
  workspace: Workspace;
  canManage: boolean;
}

/** Your own settings: name and the window Analytics opens to. */
export function GeneralForm({ user, defaultRangeDays, workspace, canManage }: GeneralFormProps) {
  const [name, setName] = useState(user.name);
  const [range, setRange] = useState<RangeDays>(defaultRangeDays);
  const [errors, setErrors] = useState<ProfileErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const rangeGroup = useId();
  const { busy, saved, save, edited } = useSectionSave();
  const zone = TIME_ZONES.find((entry) => entry.id === workspace.timeZone)?.name ?? workspace.timeZone;
  const currency = CURRENCIES.find((entry) => entry.code === workspace.currency)?.name ?? workspace.currency;

  function submit() {
    const input = { name, defaultRangeDays: range };
    const found = validateProfile(input);
    setErrors(found);
    if (found.name) return nameRef.current?.focus();
    save(() => updateProfileAction({ ...input, name: name.trim() }), "Couldn't save your settings");
  }

  return (
    <SettingsSection id="general" title="General" tag="Only you" onSubmit={submit} busy={busy} saved={saved}>
      <Field id="profile-name" label="Name" error={errors.name}>
        <input ref={nameRef} className="cor-input" id="profile-name" value={name} autoComplete="name" aria-invalid={errors.name ? true : undefined} aria-describedby="profile-name-help"
          onChange={(event) => { setName(event.target.value); edited(); }} onBlur={() => setErrors(validateProfile({ name, defaultRangeDays: range }))} />
      </Field>
      <Field id="profile-email" label="Email" help="You sign in with this address.">
        <input className="cor-input cor-input--mono" id="profile-email" value={user.email} readOnly aria-describedby="profile-email-help" />
      </Field>
      <fieldset className="cor-settings-form__wide cor-settings-choices">
        <legend className="cor-tag">Default date range</legend>
        <span className="cor-row" style={{ gap: "var(--space-6)" }}>
          {RANGE_DAYS.map((days) => (
            <label key={days} className="cor-check"><input type="radio" name={rangeGroup} checked={range === days} onChange={() => { setRange(days); edited(); }} /><span>Last {days} days</span></label>
          ))}
        </span>
        <span className="cor-help">Analytics opens to this window. A link with its own dates still wins.</span>
      </fieldset>
      <p className="cor-help cor-settings-form__wide">
        Times and money follow the workspace, so everyone&apos;s numbers match: {zone} · {currency}.{" "}
        {canManage && <Link className="cor-link" href="/settings?tab=workspace" scroll={false}>Change in Workspace</Link>}
      </p>
    </SettingsSection>
  );
}
