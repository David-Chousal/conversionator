"use client";

import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { BAY_KINDS, type BayConfig } from "@/lib/analytics/layout";

interface BayFrameProps {
  bay: BayConfig;
  name: string;
  editing: boolean;
  picked: boolean;
  dragging: boolean;
  children: ReactNode;
  onGripKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onGripPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onRemove: () => void;
  onResizeKeyDown: (event: KeyboardEvent<HTMLSpanElement>) => void;
  onResizePointerDown: (event: PointerEvent<HTMLSpanElement>) => void;
}

/** A bay's slot on the 12-column grid, with move, remove and resize controls in Customize mode. */
export function BayFrame({ bay, name, editing, picked, dragging, children, ...handlers }: BayFrameProps) {
  const spans = BAY_KINDS[bay.kind].spans;
  const classes = ["cor-bay-slot", `span-${bay.span}`, editing && "cor-bay-slot--edit", picked && "is-picked", dragging && "is-dragging"].filter(Boolean).join(" ");
  return (
    <div className={classes} data-bay-id={bay.id} data-testid={`slot-${bay.id}`}>
      {editing && (
        <div className="cor-bay-slot__bar">
          <button type="button" className="cor-bay-slot__grip" aria-label={`Move ${name}`} aria-pressed={picked} onKeyDown={handlers.onGripKeyDown} onPointerDown={handlers.onGripPointerDown}>
            <Icon name="drag" />
          </button>
          <span className="cor-tag cor-bay-slot__name" title={name}>{name}</span>
          <span className="cor-tag">{bay.span} / 12</span>
          <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label={`Remove ${name}`} onClick={handlers.onRemove}><Icon name="close" /></button>
        </div>
      )}
      <div className="cor-bay-slot__content" inert={editing || undefined}>{children}</div>
      {editing && (
        <span
          role="slider"
          tabIndex={0}
          className="cor-bay-slot__resize"
          aria-label={`Width of ${name}`}
          aria-valuemin={spans[0]}
          aria-valuemax={spans[spans.length - 1]}
          aria-valuenow={bay.span}
          aria-valuetext={`${bay.span} of 12 columns`}
          onKeyDown={handlers.onResizeKeyDown}
          onPointerDown={handlers.onResizePointerDown}
        />
      )}
    </div>
  );
}
