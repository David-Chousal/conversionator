"use client";

import { useTransition } from "react";
import { changeRoleAction, removeMemberAction } from "@/app/(app)/team/actions";
import { useToast } from "@/components/feedback/Toaster";
import { HoldKey } from "@/components/ui/HoldKey";
import type { Role } from "@/lib/data";
import type { MemberRow } from "@/lib/data/team-view";

interface MemberListProps {
  members: MemberRow[];
  canManage: boolean;
}

function RoleBadge({ role, reason }: { role: Role; reason?: string | null }) {
  return <span className={role === "admin" ? "cor-badge cor-badge--solid" : "cor-badge"} title={reason ?? undefined}>{role === "admin" ? "Admin" : "Member"}</span>;
}

/** Everyone in the workspace, with inline role changes and hold-to-remove for admins. */
export function MemberList({ members, canManage }: MemberListProps) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();

  function changeRole(member: MemberRow, role: Role) {
    startTransition(async () => {
      const result = await changeRoleAction(member.id, role);
      show(result.ok
        ? { tone: "ok", title: `${member.name} is now ${role === "admin" ? "an admin" : "a member"}`, detail: role === "admin" ? "They can manage connections, the team and workspace settings." : "They keep access to analytics, reports and their own alerts." }
        : { tone: "failed", title: `Couldn't change ${member.name}'s role`, detail: result.message });
    });
  }

  function remove(member: MemberRow) {
    startTransition(async () => {
      const result = await removeMemberAction(member.id);
      show(result.ok
        ? { tone: "ok", title: `Removed ${member.name}`, detail: "They lost access immediately." }
        : { tone: "failed", title: `Couldn't remove ${member.name}`, detail: result.message });
    });
  }

  return (
    <div className="cor-table-wrap">
      <table className="cor-table cor-team-table cor-team-table--members">
        <colgroup><col /><col className="cor-team-table__role" /><col className="cor-team-table__when" /><col className="cor-team-table__actions" /></colgroup>
        <thead><tr><th scope="col">Member</th><th scope="col">Role</th><th scope="col">Last active</th><th scope="col"><span className="cor-visually-hidden">Actions</span></th></tr></thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>
                <span className="cor-person">
                  <span className="cor-avatar" aria-hidden="true">{member.initials}</span>
                  <span className="cor-list__main"><strong>{member.name} {member.isYou && <span className="cor-tag">You</span>}</strong><span>{member.email}</span></span>
                </span>
              </td>
              <td>
                {canManage && !member.roleLocked ? (
                  <select className="cor-input cor-team-table__select" id={`role-${member.id}`} aria-label={`Role for ${member.name}`} value={member.role} disabled={busy} onChange={(event) => changeRole(member, event.target.value as Role)}>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                  </select>
                ) : (
                  <RoleBadge role={member.role} reason={member.isYou ? null : member.roleLocked} />
                )}
              </td>
              <td><span className="cor-tag">{member.lastActive}</span></td>
              <td className="n">
                {canManage && !member.removeBlocked && <HoldKey size="sm" label="Hold to remove" holdLabel={`Hold to remove ${member.name}`} onConfirm={() => remove(member)} disabled={busy} />}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
