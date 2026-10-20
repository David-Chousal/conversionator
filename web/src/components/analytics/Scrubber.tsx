"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { addDays, formatDay, type IsoDate } from "@/lib/analytics/dates";
import { dayAtPosition, moveWindow, resizeWindow, type DateWindow } from "@/lib/analytics/scrub";

interface ScrubberProps {
  days: { date: IsoDate; spend: number }[];
  window: DateWindow;
  onCommit: (window: DateWindow) => void;
}

type DragMode = "move" | "from" | "to";
const HEIGHT = 48;

/** Daily spend for the whole history with a draggable, resizable window. Commits on release. */
export function Scrubber({ days, window, onCommit }: ScrubberProps) {
  const [draft, setDraft] = useState(window);
  // Latest draft for commit handlers, which can fire before React re-renders (fast key presses). Written only in events.
  const latest = useRef(window);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: DragMode; startFraction: number; startWindow: DateWindow } | null>(null);
  const dates = days.map((day) => day.date);
  const max = Math.max(...days.map((day) => day.spend), 1);
  const indexOf = (date: IsoDate) => Math.max(0, dates.indexOf(date));
  const percent = (index: number) => `${(index / days.length) * 100}%`;
  const area = `M0,${HEIGHT} ${days.map((day, i) => `L${i + 0.5},${(HEIGHT - (day.spend / max) * (HEIGHT - 4)).toFixed(1)}`).join(" ")} L${days.length},${HEIGHT} Z`;

  function updateDraft(next: DateWindow) {
    latest.current = next;
    setDraft(next);
  }

  function fractionAt(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect();
    return rect && rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
  }

  function startDrag(mode: DragMode, event: PointerEvent<HTMLElement>) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    drag.current = { mode, startFraction: fractionAt(event.clientX), startWindow: latest.current };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const active = drag.current;
    if (!active) return;
    const fraction = fractionAt(event.clientX);
    if (active.mode === "move") {
      updateDraft(moveWindow(active.startWindow, Math.round((fraction - active.startFraction) * days.length), dates));
    } else {
      updateDraft(resizeWindow(active.startWindow, active.mode, dayAtPosition(fraction, dates), dates));
    }
  }

  function endDrag() {
    if (!drag.current) return;
    drag.current = null;
    onCommit(latest.current);
  }

  function onHandleKey(end: "from" | "to") {
    return (event: KeyboardEvent<HTMLSpanElement>) => {
      const step = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
      if (step === 0) return;
      event.preventDefault();
      const current = latest.current;
      updateDraft(resizeWindow(current, end, addDays(current[end], step * (event.shiftKey ? 7 : 1)), dates));
    };
  }

  const commitOnKeyUp = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") onCommit(latest.current);
  };

  const fromIndex = indexOf(draft.from);
  const toIndex = indexOf(draft.to);
  const handle = (end: "from" | "to", index: number, label: string) => (
    <span
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={days.length - 1}
      aria-valuenow={index}
      aria-valuetext={formatDay(draft[end])}
      className="cor-scrub__handle"
      style={{ left: percent(end === "from" ? index : index + 1) }}
      onPointerDown={(event) => startDrag(end, event)}
      onKeyDown={onHandleKey(end)}
      onKeyUp={commitOnKeyUp}
    />
  );

  return (
    <div className="cor-scrub-track" ref={trackRef} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
      <svg className="cor-scrub" viewBox={`0 0 ${days.length} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
        <rect className="win" x={fromIndex} y="0" width={toIndex - fromIndex + 1} height={HEIGHT} />
        <path className="area" d={area} />
        <rect className="win-line" x={fromIndex} y={HEIGHT - 2} width={toIndex - fromIndex + 1} height="2" />
      </svg>
      <span className="cor-scrub__body" style={{ left: percent(fromIndex), width: percent(toIndex - fromIndex + 1) }} onPointerDown={(event) => startDrag("move", event)} aria-hidden="true" />
      {handle("from", fromIndex, "Window start")}
      {handle("to", toIndex, "Window end")}
    </div>
  );
}
