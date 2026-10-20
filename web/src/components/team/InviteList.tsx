"use client";

import { useTransition } from "react";
import { resendInviteAction, revokeInviteAction } from "@/app/(app)/team/actions";
import { useToast } from "@/components/feedback/Toaster";
import { Icon } from "@/components/ui/Icon";
import type { InviteRow } from "@/lib/data/team-view";

interface InviteListProps {
  invites: InviteRow[];
  canManage: boolean;
}

/** Invitations nobody has accepted yet, with Resend and Revoke. */
export function InviteList({ invites, canManage }: InviteListProps) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();

  function resend(invite: InviteRow) {
    startTransition(async () => {
      const result = await resendInviteAction(invite.id);
      show(result.ok ? { tone: "ok", title: `Invitation resent to ${invite.email}`, detail: "It expires in 7 days." } : { tone: "failed", title: "Couldn't resend the invitation", detail: result.message });
    });
  }

  function revoke(invite: InviteRow) {
    startTransition(async () => {
      const result = await revokeInviteAction(invite.id);
      show(result.ok ? { tone: "ok", title: `Revoked the invitation for ${invite.email}`, detail: "The link in their email no longer works." } : { tone: "failed", title: "Couldn't revoke the invitation", detail: result.message });
    });
  }

  return (
    <div className="cor-table-wrap">
      <table className="cor-table cor-team-table cor-team-table--invites">
        <colgroup><col /><col className="cor-team-table__role" /><col className="cor-team-table__when" /><col className="cor-team-table__actions" /></colgroup>
        <thead><tr><th scope="col">Invited</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"><span className="cor-visually-hidden">Actions</span></th></tr></thead>
        <tbody>
          {invites.map((invite) => (
            <tr key={invite.id}>
              <td>
                <span className="cor-person">
                  <span className="cor-avatar cor-avatar--ghost" aria-hidden="true">?</span>
                  <span className="cor-list__main"><strong>{invite.email}</strong><span>{invite.detail}</span></span>
                </span>
              </td>
              <td><span className="cor-badge">{invite.role === "admin" ? "Admin" : "Member"}</span></td>
              <td><span className={invite.expired ? "cor-badge cor-badge--muted" : "cor-badge cor-badge--pending"}>{invite.status}</span></td>
              <td className="n">
                {canManage && (
                  <span className="cor-row" style={{ gap: "var(--space-2)", justifyContent: "flex-end" }}>
                    <button type="button" className="cor-link" aria-label={`Resend invitation to ${invite.email}`} disabled={busy} onClick={() => resend(invite)}>Resend</button>
                    <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label={`Revoke invitation for ${invite.email}`} disabled={busy} onClick={() => revoke(invite)}><Icon name="close" /></button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
