import { connection } from "next/server";
import { dataSource } from "./index";
import { inviteRows, memberRows, type InviteRow, type MemberRow } from "./team-view";

export interface TeamPageData {
  members: MemberRow[];
  invites: InviteRow[];
  existing: { members: string[]; invites: string[] };
  canManage: boolean;
  workspaceName: string;
}

/** Members, pending invitations and who may manage them. Request time only. */
export async function loadTeamPage(): Promise<TeamPageData> {
  await connection();
  const [members, invites, user, workspace] = await Promise.all([dataSource.listMembers(), dataSource.listInvites(), dataSource.getCurrentUser(), dataSource.getWorkspace()]);
  const now = Date.now();
  return {
    members: memberRows(members, user.id, now),
    invites: inviteRows(invites, now),
    existing: { members: members.map((member) => member.email), invites: invites.map((invite) => invite.email) },
    canManage: user.role === "admin",
    workspaceName: workspace.name,
  };
}
