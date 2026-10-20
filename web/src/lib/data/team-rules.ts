import type { InviteProblem, Member } from "./team-types";
import type { Role } from "./types";

export const MAX_INVITES_PER_BATCH = 20;
// A pragmatic check: something@domain.tld with no spaces. The invitation email is the real test.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function splitEmails(text: string): string[] {
  return text.split(/[\s,;]+/).map((part) => part.trim()).filter(Boolean);
}

/** Which addresses can be invited, and why the others can't. */
export function checkInviteEmails(emails: string[], members: Pick<Member, "email">[], invites: { email: string }[]): { valid: string[]; problems: InviteProblem[] } {
  const memberEmails = new Set(members.map((member) => member.email.toLowerCase()));
  const invited = new Set(invites.map((invite) => invite.email.toLowerCase()));
  const unique = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const valid: string[] = [];
  const problems: InviteProblem[] = [];
  for (const email of unique) {
    if (!EMAIL.test(email)) problems.push({ email, reason: "isn't a full email address" });
    else if (memberEmails.has(email)) problems.push({ email, reason: "is already in the workspace" });
    else if (invited.has(email)) problems.push({ email, reason: "already has an invitation; resend it instead" });
    else if (valid.length >= MAX_INVITES_PER_BATCH) problems.push({ email, reason: `is over the limit of ${MAX_INVITES_PER_BATCH} invitations at once` });
    else valid.push(email);
  }
  return { valid, problems };
}

const adminCount = (members: Member[]) => members.filter((member) => member.role === "admin").length;

/** Why a role change isn't allowed, or null if it is. */
export function roleChangeBlock(members: Member[], memberId: string, role: Role, actingUserId: string): string | null {
  if (memberId === actingUserId) return "You can't change your own role. Ask another admin.";
  const member = members.find((entry) => entry.id === memberId);
  if (member?.role === "admin" && role === "member" && adminCount(members) <= 1) return "The workspace needs at least one admin.";
  return null;
}

/** Why removing a member isn't allowed, or null if it is. */
export function removalBlock(members: Member[], memberId: string, actingUserId: string): string | null {
  if (memberId === actingUserId) return "You can't remove yourself. Ask another admin.";
  const member = members.find((entry) => entry.id === memberId);
  if (member?.role === "admin" && adminCount(members) <= 1) return "The workspace needs at least one admin.";
  return null;
}
