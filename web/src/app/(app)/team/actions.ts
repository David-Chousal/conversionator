"use server";

import { refresh } from "next/cache";
import { runAdmin, type ActionResult } from "@/lib/actions/admin";
import { dataSource, type Invite, type Role } from "@/lib/data";

const asRole = (value: unknown): Role => (value === "admin" ? "admin" : "member");
const asEmails = (value: unknown): string[] => (Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string").slice(0, 50) : []);

export async function inviteMembersAction(emails: string[], role: Role): Promise<ActionResult<Invite[]>> {
  const result = await runAdmin(() => dataSource.inviteMembers(asEmails(emails), asRole(role)));
  refresh();
  return result;
}

export async function resendInviteAction(inviteId: string): Promise<ActionResult<Invite>> {
  const result = await runAdmin(() => dataSource.resendInvite(String(inviteId)));
  refresh();
  return result;
}

export async function revokeInviteAction(inviteId: string): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    await dataSource.revokeInvite(String(inviteId));
    return null;
  });
  refresh();
  return result;
}

export async function changeRoleAction(memberId: string, role: Role): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    await dataSource.changeRole(String(memberId), asRole(role));
    return null;
  });
  refresh();
  return result;
}

export async function removeMemberAction(memberId: string): Promise<ActionResult<null>> {
  const result = await runAdmin(async () => {
    await dataSource.removeMember(String(memberId));
    return null;
  });
  refresh();
  return result;
}
