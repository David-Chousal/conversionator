"use client";

import { useState } from "react";
import { Banner } from "@/components/feedback/Banner";
import { Key } from "@/components/ui/Key";
import type { InviteRow, MemberRow } from "@/lib/data/team-view";
import { InviteDialog } from "./InviteDialog";
import { InviteList } from "./InviteList";
import { MemberList } from "./MemberList";

interface TeamBoardProps {
  members: MemberRow[];
  invites: InviteRow[];
  existing: { members: string[]; invites: string[] };
  canManage: boolean;
  workspaceName: string;
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/** The Team page: members, pending invitations and the invite dialog. */
export function TeamBoard({ members, invites, existing, canManage, workspaceName }: TeamBoardProps) {
  const [inviting, setInviting] = useState(false);
  const admins = members.filter((member) => member.role === "admin").length;

  return (
    <>
      {!canManage && <Banner tone="info" icon="lock">Only admins can invite people, change roles or remove members.</Banner>}
      <section className="cor-bay" aria-labelledby="members-title">
        <div className="cor-bay__head">
          <h2 className="cor-bay__title" id="members-title">Members</h2>
          <span className="cor-row" style={{ gap: "var(--space-3)" }}>
            <span className="cor-tag">{plural(members.length, "person").replace("persons", "people")} · {plural(admins, "admin")}</span>
            {canManage && <Key size="sm" variant="primary" icon="plus" onClick={() => setInviting(true)}>Invite member</Key>}
          </span>
        </div>
        <MemberList members={members} canManage={canManage} />
      </section>
      {invites.length > 0 && (
        <section className="cor-bay" aria-labelledby="invites-title">
          <div className="cor-bay__head">
            <h2 className="cor-bay__title" id="invites-title">Pending invites</h2>
            <span className="cor-tag">{plural(invites.length, "invitation")} · links expire after 7 days</span>
          </div>
          <InviteList invites={invites} canManage={canManage} />
        </section>
      )}
      <InviteDialog open={inviting} workspaceName={workspaceName} existing={existing} onClose={() => setInviting(false)} />
    </>
  );
}
