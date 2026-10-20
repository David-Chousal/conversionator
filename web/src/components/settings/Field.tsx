import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  help?: ReactNode;
  children: ReactNode;
}

/** Label above, the control, then the error (or help) under it. The control sets aria-describedby to `${id}-help`. */
export function Field({ id, label, error, help, children }: FieldProps) {
  return (
    <div className="cor-fieldset">
      <span className="cor-fieldset__label"><label className="cor-tag" htmlFor={id}>{label}</label></span>
      {children}
      {(error || help) && (
        <span id={`${id}-help`} className={error ? "cor-help cor-help--error" : "cor-help"}>
          {error ? <><Icon name="warning" />{error}</> : help}
        </span>
      )}
    </div>
  );
}
