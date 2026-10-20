"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

export interface ToastInput {
  tone?: "ok" | "failed" | "neutral";
  title: string;
  detail?: string;
}

interface Toast extends ToastInput {
  id: number;
}

const AUTO_DISMISS_MS = 5000;
const MAX_TOASTS = 3;
const ToastContext = createContext<{ show: (toast: ToastInput) => void } | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <Toaster>.");
  return context;
}

function ToastView({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const failed = toast.tone === "failed";

  useEffect(() => {
    if (failed || paused) return;
    const timer = setTimeout(() => onDismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [failed, paused, onDismiss, toast.id]);

  const toneClass = toast.tone && toast.tone !== "neutral" ? ` cor-toast--${toast.tone}` : "";
  return (
    <div
      className={`cor-toast${toneClass}`}
      role={failed ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon name={failed ? "warning" : toast.tone === "ok" ? "check" : "info"} />
      <div className="cor-toast__body">
        <strong>{toast.title}</strong>
        {toast.detail && <span>{toast.detail}</span>}
      </div>
      <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label="Dismiss" onClick={() => onDismiss(toast.id)}>
        <Icon name="close" />
      </button>
    </div>
  );
}

/** Provides useToast() and renders the toast stack bottom-left. */
export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
  const show = useCallback((input: ToastInput) => {
    const id = nextId.current++;
    setToasts((current) => [{ ...input, id }, ...current].slice(0, MAX_TOASTS));
  }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext value={value}>
      {children}
      <div className="cor-toasts">
        {toasts.map((toast) => <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />)}
      </div>
    </ToastContext>
  );
}
