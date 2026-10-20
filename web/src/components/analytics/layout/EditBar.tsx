"use client";

import { Key } from "@/components/ui/Key";

interface EditBarProps {
  viewName: string;
  dirty: boolean;
  saving: boolean;
  canDelete: boolean;
  onReset: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/** The inverted strip pinned above the grid while a layout is being edited. */
export function EditBar({ viewName, dirty, saving, canDelete, onReset, onDelete, onCancel, onSave }: EditBarProps) {
  return (
    <div className="cor-editbar" role="toolbar" aria-label="Layout editing">
      <span className="cor-tag">Editing layout · {viewName}</span>
      {dirty && <span className="cor-tag cor-editbar__dirty">Unsaved changes</span>}
      <span className="cor-row" style={{ gap: "var(--space-2)", marginLeft: "auto" }}>
        <Key size="sm" onClick={onReset}>Reset to default</Key>
        {canDelete && <Key size="sm" onClick={onDelete}>Delete view</Key>}
        <Key size="sm" shortcut="Esc" onClick={onCancel}>Cancel</Key>
        <Key size="sm" variant="primary" shortcut="⌘S" onClick={onSave} disabled={saving} aria-busy={saving}>Save view</Key>
      </span>
    </div>
  );
}
