import type { FormEvent, ReactNode } from "react";
import { Key } from "@/components/ui/Key";

interface SettingsSectionProps {
  id: string;
  title: string;
  tag?: ReactNode;
  children: ReactNode;
  /** Omit to show the section read-only, without a Save key. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  busy?: boolean;
  saved?: boolean;
}

/** A settings bay: one form, one Save key at the bottom. */
export function SettingsSection({ id, title, tag, children, onSubmit, busy = false, saved = false }: SettingsSectionProps) {
  return (
    <section className="cor-bay" aria-labelledby={`${id}-title`}>
      <div className="cor-bay__head">
        <h2 className="cor-bay__title" id={`${id}-title`}>{title}</h2>
        {tag && <span className="cor-tag">{tag}</span>}
      </div>
      <form className="cor-settings-form" noValidate onSubmit={(event) => { event.preventDefault(); onSubmit?.(event); }}>
        {children}
        {onSubmit && (
          <div className="cor-settings-form__foot">
            <Key type="submit" variant="primary" disabled={busy} icon={saved ? "check" : undefined}>{saved ? "Saved" : "Save"}</Key>
          </div>
        )}
      </form>
    </section>
  );
}
