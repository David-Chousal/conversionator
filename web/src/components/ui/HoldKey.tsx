"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

interface HoldKeyProps {
  /** Visible text, e.g. "Hold to disconnect". */
  label: string;
  /** Full accessible name naming the target, e.g. "Hold to disconnect Meta Ads". */
  holdLabel: string;
  onConfirm: () => void;
  durationMs?: number;
  size?: "md" | "sm";
  disabled?: boolean;
}

const TICK_MS = 30;
const isHoldKey = (event: KeyboardEvent) => event.key === " " || event.key === "Enter";

/** Destructive key that fires only after being held, replacing confirm dialogs. */
export function HoldKey({ label, holdLabel, onConfirm, durationMs = 900, size = "md", disabled = false }: HoldKeyProps) {
  const [held, setHeld] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  function release() {
    clearTimer();
    setHeld(0);
  }

  function press() {
    if (disabled || timer.current) return;
    const startedAt = Date.now();
    timer.current = setInterval(() => {
      const fraction = (Date.now() - startedAt) / durationMs;
      if (fraction < 1) {
        setHeld(fraction * 100);
        return;
      }
      release();
      onConfirm();
    }, TICK_MS);
  }

  useEffect(() => clearTimer, []);

  const classes = ["cor-key", "cor-key--hold", size === "sm" && "cor-key--sm"].filter(Boolean).join(" ");
  return (
    <button
      type="button"
      className={classes}
      style={{ "--held": `${held}%` } as CSSProperties}
      aria-label={holdLabel}
      disabled={disabled}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      onKeyDown={(event) => {
        if (!isHoldKey(event) || event.repeat) return;
        event.preventDefault();
        press();
      }}
      onKeyUp={(event) => {
        if (isHoldKey(event)) release();
      }}
    >
      <span>{label}</span>
    </button>
  );
}
