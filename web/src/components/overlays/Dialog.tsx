"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function focusables(root: HTMLElement | null): HTMLElement[] {
  return root ? [...root.querySelectorAll<HTMLElement>(FOCUSABLE)] : [];
}

/** Modal task. Focus moves in, is trapped, and returns to the trigger on close. */
export function Dialog({ open, title, onClose, children, footer }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    (dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]") ?? focusables(dialogRef.current)[0] ?? dialogRef.current)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const entries = focusables(dialogRef.current);
      if (entries.length === 0) return;
      const first = entries[0];
      const last = entries[entries.length - 1];
      const inside = dialogRef.current?.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="cor-scrim cor-scrim--fixed" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="cor-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
        <div className="cor-dialog__head">
          <h2 className="cor-dialog__title" id={titleId}>{title}</h2>
          <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label="Close" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        {children}
        {footer && <div className="cor-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
