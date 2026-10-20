"use client";

import { useState, type Dispatch, type PointerEvent, type RefObject, type SetStateAction } from "react";
import { moveBay, resizeBay, type BayConfig } from "@/lib/analytics/layout";

const GRID_COLUMNS = 12;

/** Follows the pointer until it is released, then cleans up. */
function track(onMove: (event: globalThis.PointerEvent) => void, onDone: () => void) {
  const up = () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    onDone();
  };
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}

/** Pointer drag to reorder bays (live, by hovering another slot) and to resize them by column. */
export function useBayPointer(setDraft: Dispatch<SetStateAction<BayConfig[]>>, gridRef: RefObject<HTMLDivElement | null>) {
  const [dragId, setDragId] = useState<string | null>(null);

  function startMove(id: string, event: PointerEvent<HTMLElement>) {
    event.preventDefault();
    setDragId(id);
    track((move) => {
      const overId = document.elementFromPoint(move.clientX, move.clientY)?.closest("[data-bay-id]")?.getAttribute("data-bay-id");
      if (!overId || overId === id) return;
      setDraft((bays) => moveBay(bays, bays.findIndex((bay) => bay.id === id), bays.findIndex((bay) => bay.id === overId)));
    }, () => setDragId(null));
  }

  function startResize(id: string, event: PointerEvent<HTMLElement>) {
    const grid = gridRef.current;
    const slot = event.currentTarget.closest("[data-bay-id]");
    if (!grid || !slot) return;
    event.preventDefault();
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    const columnWidth = (grid.getBoundingClientRect().width + gap) / GRID_COLUMNS;
    const left = slot.getBoundingClientRect().left;
    track((move) => setDraft((bays) => resizeBay(bays, id, (move.clientX - left + gap) / columnWidth)), () => undefined);
  }

  return { dragId, startMove, startResize };
}
