"use client";

import { Key } from "@/components/ui/Key";
import type { SavedView } from "@/lib/analytics/layout";

interface ViewTabsProps {
  views: SavedView[];
  activeViewId: string;
  editing: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onCustomize: () => void;
}

/** Saved views as tabs, with + New view and the Customize key. */
export function ViewTabs({ views, activeViewId, editing, onSelect, onNew, onCustomize }: ViewTabsProps) {
  return (
    <div className="cor-viewbar">
      <div className="cor-tabs" role="tablist" aria-label="Saved views">
        {views.map((view) => (
          <button key={view.id} type="button" role="tab" className="cor-tab" aria-selected={view.id === activeViewId} disabled={editing && view.id !== activeViewId} onClick={() => view.id !== activeViewId && onSelect(view.id)}>
            {view.name}
          </button>
        ))}
        <button type="button" className="cor-tab" disabled={editing} onClick={onNew}>+ New view</button>
      </div>
      {!editing && <Key size="sm" icon="layout" shortcut="E" onClick={onCustomize}>Customize</Key>}
    </div>
  );
}
