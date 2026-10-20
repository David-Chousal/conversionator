import { formatDay, todayIn } from "@/lib/analytics/dates";
import { formatAge } from "@/lib/format";
import { removalBlock, roleChangeBlock } from "./team-rules";
import type { Invite, Member } from "./team-types";
import type { Role } from "./types";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const UTC = "UTC";
const HOUR = 60 * MINUTE;

/** Time left on an invitation, rounded up so it never reads shorter than it is. */
function timeLeft(remaining: number): string {
  return remaining < DAY ? `${Math.ceil(remaining / HOUR)}h` : `${Math.ceil(remaining / DAY)}d`;
}

export interface MemberRow extends Member {
  isYou: boolean;
  lastActive: string;
  /** Why the role can't be changed, or null. */
  roleLocked: string | null;
  /** Why the member can't be removed, or null. */
  removeBlocked: string | null;
}

export interface InviteRow {
  id: string;
  email: string;
  role: Role;
  detail: string;
  status: string;
  expired: boolean;
}

/** "Dakota Goldstein" → "Dakota G." */
export const shortName = (name: string): string => {
  const [first, last] = name.split(" ");
  return last ? `${first} ${last[0]}.` : first;
};

export function lastActiveLabel(lastActiveAt: string | null, now: number): string {
  if (!lastActiveAt) return "Never";
  const elapsed = now - Date.parse(lastActiveAt);
  if (elapsed < 5 * MINUTE) return "Now";
  if (elapsed < DAY) return `${formatAge(elapsed)} ago`;
  if (elapsed < 2 * DAY) return "Yesterday";
  return formatDay(todayIn(UTC, Date.parse(lastActiveAt)));
}

export function memberRows(members: Member[], actingUserId: string, now: number): MemberRow[] {
  const blockForRole = (member: Member) => roleChangeBlock(members, member.id, member.role === "admin" ? "member" : "admin", actingUserId);
  return members.map((member) => ({
    ...member,
    isYou: member.id === actingUserId,
    lastActive: lastActiveLabel(member.lastActiveAt, now),
    roleLocked: blockForRole(member),
    removeBlocked: removalBlock(members, member.id, actingUserId),
  }));
}

export function inviteRows(invites: Invite[], now: number): InviteRow[] {
  return invites.map((invite) => {
    const remaining = Date.parse(invite.expiresAt) - now;
    const expired = remaining <= 0;
    return {
      id: invite.id, email: invite.email, role: invite.role, expired,
      status: expired ? "Expired" : `Expires ${timeLeft(remaining)}`,
      detail: `Invited by ${shortName(invite.invitedBy)} on ${formatDay(todayIn(UTC, Date.parse(invite.invitedAt)))}`,
    };
  });
}
