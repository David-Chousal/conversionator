"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { createViewAction, deleteViewAction, saveViewAction } from "@/app/(app)/analytics/actions";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useToast } from "@/components/feedback/Toaster";
import { boardContext } from "@/lib/analytics/board-context";
import { analyticsHref } from "@/lib/analytics/filter";
import { DEFAULT_VIEW_ID, addBay, moveBay, removeBay, resolveBays, stepSpan, systemDefault, type BayConfig, type BayKind, type SavedView } from "@/lib/analytics/layout";
import type { AnalyticsReport, MetricKey } from "@/lib/analytics/types";
import { BayContent } from "./BayContent";
import { BayFrame } from "./BayFrame";
import { BayLibrary } from "./BayLibrary";
import { EditBar } from "./EditBar";
import { LayoutDialogs, type LayoutDialog } from "./LayoutDialogs";
import { ViewTabs } from "./ViewTabs";
import { bayName } from "./bay-names";
import { useBayPointer } from "./useBayPointer";

interface LayoutBoardProps {
  report: AnalyticsReport;
  views: SavedView[];
  activeViewId: string;
}

const STEP: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** The editable part of Analytics: saved views, the bay grid, and Customize mode. */
export function LayoutBoard({ report, views, activeViewId }: LayoutBoardProps) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, startTransition] = useTransition();
  const source = report.attribution.source;
  const view = views.find((entry) => entry.id === activeViewId) ?? views[0];
  const saved = resolveBays(view, source);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BayConfig[]>(saved);
  const [picked, setPicked] = useState<{ id: string; origin: number } | null>(null);
  const [dialog, setDialog] = useState<LayoutDialog>(null);
  const [announcement, setAnnouncement] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);
  const { dragId, startMove, startResize } = useBayPointer(setDraft, gridRef);
  const context = boardContext(report);
  const bays = editing ? draft : saved;
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(saved);
  const hrefFor = (viewId: string) => analyticsHref(report.filter, report.today, viewId);
  const actions = useRef({ enter: () => {}, cancel: () => {}, save: () => {} });

  function enter(startFrom: BayConfig[] = saved) {
    setDraft(startFrom);
    setPicked(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setPicked(null);
  }

  function save() {
    const followsSystem = view.id === DEFAULT_VIEW_ID && JSON.stringify(draft) === JSON.stringify(systemDefault(source));
    startTransition(async () => {
      const result = await saveViewAction(view.id, followsSystem ? null : draft);
      if (!result.ok) return show({ tone: "failed", title: `Couldn't save ${view.name}`, detail: result.message });
      setEditing(false);
      show({ tone: "ok", title: `Saved ${view.name}`, detail: "This layout opens the next time you choose this view." });
    });
  }

  function create(name: string) {
    startTransition(async () => {
      const result = await createViewAction(name, bays);
      if (!result.ok) return show({ tone: "failed", title: "Couldn't create the view", detail: result.message });
      setDialog(null);
      router.replace(hrefFor(result.data.id), { scroll: false });
      enter(result.data.bays ?? bays);
      show({ tone: "ok", title: `Created ${result.data.name}`, detail: "Arrange its bays, then choose Save view." });
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteViewAction(view.id);
      if (!result.ok) return show({ tone: "failed", title: `Couldn't delete ${view.name}`, detail: result.message });
      setDialog(null);
      setEditing(false);
      router.replace(hrefFor(DEFAULT_VIEW_ID), { scroll: false });
      show({ tone: "ok", title: `Deleted ${view.name}` });
    });
  }

  useEffect(() => {
    actions.current = { enter: () => enter(), cancel, save };
  });

  useEffect(() => {
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (isTyping(event.target) || document.querySelector('[role="dialog"]')) return;
      if (!editing && event.key === "e" && !event.metaKey && !event.ctrlKey && !event.altKey) actions.current.enter();
      else if (editing && event.key === "Escape") actions.current.cancel();
      else if (editing && (event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        actions.current.save();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [editing]);

  function onGripKey(bay: BayConfig, event: KeyboardEvent<HTMLButtonElement>) {
    const index = draft.findIndex((entry) => entry.id === bay.id);
    const name = bayName(bay, source);
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (picked?.id === bay.id) {
        setPicked(null);
        setAnnouncement(`${name} dropped at position ${index + 1} of ${draft.length}.`);
      } else {
        setPicked({ id: bay.id, origin: index });
        setAnnouncement(`Picked up ${name}. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
      }
      return;
    }
    if (picked?.id !== bay.id) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setDraft(moveBay(draft, index, picked.origin));
      setPicked(null);
      setAnnouncement(`${name} returned to position ${picked.origin + 1}.`);
      return;
    }
    const step = STEP[event.key];
    if (!step) return;
    event.preventDefault();
    const to = Math.max(0, Math.min(draft.length - 1, index + step));
    setDraft(moveBay(draft, index, to));
    setAnnouncement(`${name} moved to position ${to + 1} of ${draft.length}.`);
  }

  function onResizeKey(bay: BayConfig, event: KeyboardEvent<HTMLSpanElement>) {
    const step = STEP[event.key];
    if (!step) return;
    event.preventDefault();
    setDraft((current) => current.map((entry) => (entry.id === bay.id ? { ...entry, span: stepSpan(entry.kind, entry.span, step as 1 | -1) } : entry)));
  }

  const add = (kind: BayKind, metric?: MetricKey) => {
    setDraft((current) => addBay(current, kind, metric));
    setAnnouncement(`Added ${bayName({ kind, metric }, source)} at the top.`);
  };

  return (
    <div className="cor-layout-board">
      <ViewTabs views={views} activeViewId={view.id} editing={editing} onSelect={(id) => router.replace(hrefFor(id), { scroll: false })} onNew={() => setDialog("new")} onCustomize={() => enter()} />
      {editing && (
        <EditBar viewName={view.name} dirty={dirty} saving={busy} canDelete={view.id !== DEFAULT_VIEW_ID}
          onReset={() => setDialog("reset")} onDelete={() => setDialog("delete")} onCancel={cancel} onSave={save} />
      )}
      <div className={editing ? "cor-layout cor-layout--editing" : "cor-layout"}>
        <div className="cor-grid12" ref={gridRef}>
          {bays.length === 0 && (
            <div className="span-12">
              <EmptyState status={`Empty view · ${view.name}`} title="No bays on this view.">
                {editing ? "Add bays from the library on the right." : "Choose Customize to add bays."}
              </EmptyState>
            </div>
          )}
          {bays.map((bay) => (
            <BayFrame key={bay.id} bay={bay} name={bayName(bay, source)} editing={editing} picked={picked?.id === bay.id} dragging={dragId === bay.id}
              onGripKeyDown={(event) => onGripKey(bay, event)} onGripPointerDown={(event) => startMove(bay.id, event)}
              onRemove={() => setDraft((current) => removeBay(current, bay.id))}
              onResizeKeyDown={(event) => onResizeKey(bay, event)} onResizePointerDown={(event) => startResize(bay.id, event)}>
              <BayContent bay={bay} report={report} context={context} />
            </BayFrame>
          ))}
        </div>
        {editing && <BayLibrary bays={draft} source={source} onAdd={add} />}
      </div>
      <p className="cor-visually-hidden" aria-live="assertive">{announcement}</p>
      <LayoutDialogs open={dialog} viewName={view.name} busy={busy} onClose={() => setDialog(null)}
        onReset={() => { setDraft(systemDefault(source)); setDialog(null); }} onCreate={create} onDelete={remove} />
    </div>
  );
}
