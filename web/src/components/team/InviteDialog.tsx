"use client";

import { useId, useState, useTransition, type ChangeEvent, type KeyboardEvent } from "react";
import { inviteMembersAction } from "@/app/(app)/team/actions";
import { useToast } from "@/components/feedback/Toaster";
import { Dialog } from "@/components/overlays/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Key } from "@/components/ui/Key";
import type { Role } from "@/lib/data";
import { MAX_INVITES_PER_BATCH, checkInviteEmails, splitEmails } from "@/lib/data/team-rules";

interface InviteDialogProps {
  open: boolean;
  workspaceName: string;
  /** Emails already in the workspace or invited, for checking as the admin types. */
  existing: { members: string[]; invites: string[] };
  onClose: () => void;
}

const SEPARATOR = /[\s,;]/;

/** Invite people by email as Admin or Member; problems show on the tokens before anything is sent. */
export function InviteDialog({ open, workspaceName, existing, onClose }: InviteDialogProps) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();
  const [tokens, setTokens] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<Role>("member");
  const roleGroup = useId();
  const { valid, problems } = checkInviteEmails(tokens, existing.members.map((email) => ({ email })), existing.invites.map((email) => ({ email })));
  const invalid = new Set(problems.map((problem) => problem.email));

  const commit = (parts: string[]) => setTokens((current) => [...new Set([...current, ...parts.map((part) => part.toLowerCase())])]);

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    if (!SEPARATOR.test(value)) return setDraft(value);
    const parts = splitEmails(value);
    const endsWithSeparator = SEPARATOR.test(value.slice(-1));
    commit(endsWithSeparator ? parts : parts.slice(0, -1));
    setDraft(endsWithSeparator ? "" : parts.at(-1) ?? "");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && draft.trim()) {
      event.preventDefault();
      commit(splitEmails(draft));
      setDraft("");
    } else if (event.key === "Backspace" && draft === "" && tokens.length > 0) {
      setTokens((current) => current.slice(0, -1));
    }
  }

  function close() {
    setTokens([]);
    setDraft("");
    setRole("member");
    onClose();
  }

  function send() {
    startTransition(async () => {
      const result = await inviteMembersAction(valid, role);
      if (!result.ok) return show({ tone: "failed", title: "Invitations weren't sent", detail: result.message });
      close();
      show({ tone: "ok", title: valid.length === 1 ? `Invitation sent to ${valid[0]}` : `Invitations sent to ${valid.length} people`, detail: "They expire in 7 days." });
    });
  }

  return (
    <Dialog open={open} title={`Invite to ${workspaceName}`} onClose={close}
      footer={<><Key onClick={close} shortcut="Esc">Cancel</Key><Key variant="primary" onClick={send} disabled={busy || valid.length === 0 || problems.length > 0}>{valid.length > 1 ? `Send ${valid.length} invites` : "Send invite"}</Key></>}>
      <div className="cor-fieldset">
        <span className="cor-fieldset__label"><label className="cor-tag" htmlFor="invite-emails">Emails</label><span className="cor-tag">{tokens.length} of {MAX_INVITES_PER_BATCH}</span></span>
        <span className="cor-tokens">
          {tokens.map((token) => (
            <span key={token} className={invalid.has(token) ? "cor-token cor-token--invalid" : "cor-token"}>
              {token}
              <button type="button" aria-label={`Remove ${token}`} onClick={() => setTokens((current) => current.filter((entry) => entry !== token))}><Icon name="close" /></button>
            </span>
          ))}
          <input id="invite-emails" data-autofocus value={draft} placeholder={tokens.length ? "Add another…" : "name@company.com"} aria-describedby="invite-help" autoComplete="off"
            onChange={onChange} onKeyDown={onKeyDown} onBlur={() => { if (draft.trim()) { commit(splitEmails(draft)); setDraft(""); } }} />
        </span>
        <span id="invite-help" className={problems.length ? "cor-help cor-help--error" : "cor-help"}>
          {problems.length ? <><Icon name="warning" />{problems.map((problem) => `${problem.email} ${problem.reason}.`).join(" ")}</> : "Separate addresses with commas, spaces or Enter."}
        </span>
      </div>
      <fieldset className="cor-invite-roles">
        <legend className="cor-tag">Role</legend>
        <label className="cor-check"><input type="radio" name={roleGroup} id="invite-role-admin" checked={role === "admin"} onChange={() => setRole("admin")} /><span>Admin · manages connections, team and workspace</span></label>
        <label className="cor-check"><input type="radio" name={roleGroup} id="invite-role-member" checked={role === "member"} onChange={() => setRole("member")} /><span>Member · views, builds reports and alerts</span></label>
      </fieldset>
    </Dialog>
  );
}
