"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { splitEmails } from "@/lib/data/team-rules";
import { MAX_RECIPIENTS } from "@/lib/reports/rules";

interface RecipientsInputProps {
  value: string[];
  onChange: (recipients: string[]) => void;
  error?: string;
  disabled?: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Email tokens for scheduled reports; bad addresses stay in place, flagged. */
export function RecipientsInput({ value, onChange, error, disabled }: RecipientsInputProps) {
  const [draft, setDraft] = useState("");
  const commit = (text: string) => {
    const added = splitEmails(text).map((email) => email.toLowerCase());
    if (added.length > 0) onChange([...new Set([...value, ...added])]);
    setDraft("");
  };

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if ((event.key === "Enter" || event.key === ",") && draft.trim()) {
      event.preventDefault();
      commit(draft);
    } else if (event.key === "Backspace" && draft === "" && value.length > 0) onChange(value.slice(0, -1));
  }

  return (
    <div className="cor-fieldset">
      <span className="cor-fieldset__label"><label className="cor-tag" htmlFor="report-recipients">Recipients</label><span className="cor-tag">{value.length} of {MAX_RECIPIENTS}</span></span>
      <span className="cor-tokens">
        {value.map((email) => (
          <span key={email} className={EMAIL.test(email) ? "cor-token" : "cor-token cor-token--invalid"}>
            {email}
            {!disabled && <button type="button" aria-label={`Remove ${email}`} onClick={() => onChange(value.filter((entry) => entry !== email))}><Icon name="close" /></button>}
          </span>
        ))}
        <input id="report-recipients" value={draft} disabled={disabled} placeholder={value.length ? "Add another…" : "name@company.com"} aria-describedby="report-recipients-help" autoComplete="off"
          onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} onBlur={() => draft.trim() && commit(draft)} />
      </span>
      <span id="report-recipients-help" className={error ? "cor-help cor-help--error" : "cor-help"}>{error ? <><Icon name="warning" />{error}</> : "They get the file by email, with a link to open it in COR."}</span>
    </div>
  );
}
