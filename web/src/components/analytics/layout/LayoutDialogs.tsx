"use client";

import { useState, type FormEvent } from "react";
import { Dialog } from "@/components/overlays/Dialog";
import { HoldKey } from "@/components/ui/HoldKey";
import { Key } from "@/components/ui/Key";

export type LayoutDialog = "reset" | "new" | "delete" | null;

interface LayoutDialogsProps {
  open: LayoutDialog;
  viewName: string;
  busy: boolean;
  onClose: () => void;
  onReset: () => void;
  onCreate: (name: string) => void;
  onDelete: () => void;
}

function NewViewForm({ busy, onClose, onCreate }: Pick<LayoutDialogsProps, "busy" | "onClose" | "onCreate">) {
  const [name, setName] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate(name);
  }
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: "var(--space-4)" }}>
      <div className="cor-fieldset">
        <label className="cor-tag" htmlFor="new-view-name">View name</label>
        <input className="cor-input" id="new-view-name" value={name} maxLength={40} required aria-describedby="new-view-help" onChange={(event) => setName(event.target.value)} />
        <span className="cor-help" id="new-view-help">Starts as a copy of the layout you&apos;re looking at.</span>
      </div>
      <div className="cor-dialog__foot">
        <Key onClick={onClose}>Cancel</Key>
        <Key type="submit" variant="primary" disabled={busy || name.trim().length === 0}>Create view</Key>
      </div>
    </form>
  );
}

/** Confirmations for resetting, creating and deleting saved views. */
export function LayoutDialogs({ open, viewName, busy, onClose, onReset, onCreate, onDelete }: LayoutDialogsProps) {
  return (
    <>
      <Dialog open={open === "reset"} title={`Reset ${viewName} to the default layout?`} onClose={onClose}
        footer={<><Key onClick={onClose}>Cancel</Key><Key variant="primary" onClick={onReset}>Reset layout</Key></>}>
        <p style={{ margin: 0 }}>The bays go back to the standard board. Nothing is saved until you choose Save view.</p>
      </Dialog>
      <Dialog open={open === "new"} title="New view" onClose={onClose}>
        {open === "new" && <NewViewForm busy={busy} onClose={onClose} onCreate={onCreate} />}
      </Dialog>
      <Dialog open={open === "delete"} title={`Delete ${viewName}?`} onClose={onClose}
        footer={<><Key onClick={onClose}>Cancel</Key><HoldKey label="Hold to delete" holdLabel={`Hold to delete ${viewName}`} onConfirm={onDelete} disabled={busy} /></>}>
        <p style={{ margin: 0 }}>This deletes your saved layout for this view. Your data and other views aren&apos;t affected.</p>
      </Dialog>
    </>
  );
}
