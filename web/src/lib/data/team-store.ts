import { DataSourceError } from "./errors";
import { checkInviteEmails, removalBlock, roleChangeBlock } from "./team-rules";
import type { Invite, Member } from "./team-types";
import type { Role } from "./types";

export const INVITE_LIFETIME_MS = 7 * 24 * 60 * 60_000;
const HOUR = 60 * 60_000;
const DAY = 24 * HOUR;

export interface TeamStore {
  members(): Member[];
  invites(): Invite[];
  invite(emails: string[], role: Role): Invite[];
  resend(inviteId: string): Invite;
  revoke(inviteId: string): void;
  changeRole(memberId: string, role: Role): Member;
  remove(memberId: string): void;
}

const iso = (time: number) => new Date(time).toISOString();

function seedMembers(now: number): Member[] {
  const member = (id: string, name: string, email: string, role: Role, activeAgo: number | null): Member => ({
    id, name, email, role, lastActiveAt: activeAgo === null ? null : iso(now - activeAgo),
    initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  });
  return [
    member("u_david", "David Chousal", "dchousal@northwind.co", "admin", 0),
    member("u_dakota", "Dakota Goldstein", "dagoldstein@northwind.co", "admin", 2 * HOUR),
    member("u_troy", "Troy Edwards", "tedwards@northwind.co", "member", 30 * HOUR),
    member("u_priya", "Priya Natarajan", "pnatarajan@northwind.co", "member", 4 * DAY),
    member("u_sam", "Sam Okafor", "sokafor@northwind.co", "member", 12 * DAY),
  ];
}

/** Members and invitations for the workspace, in memory, acting as `actingUserId`. */
export function createTeamStore(now: () => number, actingUserId: string): TeamStore {
  const start = now();
  let members = seedMembers(start);
  let invites: Invite[] = [
    { id: "inv_maria", email: "maria@northwind.co", role: "member", invitedBy: "David Chousal", invitedAt: iso(start - 3 * DAY), expiresAt: iso(start + 4 * DAY) },
    { id: "inv_jordan", email: "jordan@northwind.co", role: "admin", invitedBy: "Dakota Goldstein", invitedAt: iso(start - 9 * DAY), expiresAt: iso(start - 2 * DAY) },
  ];
  let nextInvite = 1;

  const actorName = () => members.find((member) => member.id === actingUserId)?.name ?? "An admin";

  function findInvite(id: string): Invite {
    const invite = invites.find((entry) => entry.id === id);
    if (!invite) throw new DataSourceError("not_found", "That invitation no longer exists. Refresh the page.");
    return invite;
  }

  function findMember(id: string): Member {
    const member = members.find((entry) => entry.id === id);
    if (!member) throw new DataSourceError("not_found", "That person is no longer in the workspace. Refresh the page.");
    return member;
  }

  return {
    members: () => members,
    invites: () => invites,

    invite(emails, role) {
      const { valid, problems } = checkInviteEmails(emails, members, invites);
      if (problems.length > 0) throw new DataSourceError("invalid_input", problems.map((problem) => `${problem.email} ${problem.reason}.`).join(" "));
      if (valid.length === 0) throw new DataSourceError("invalid_input", "Add at least one email address.");
      const time = now();
      const created = valid.map((email) => ({ id: `inv_${time}_${nextInvite++}`, email, role, invitedBy: actorName(), invitedAt: iso(time), expiresAt: iso(time + INVITE_LIFETIME_MS) }));
      invites = [...created, ...invites];
      return created;
    },

    resend(inviteId) {
      const time = now();
      const resent = { ...findInvite(inviteId), invitedBy: actorName(), invitedAt: iso(time), expiresAt: iso(time + INVITE_LIFETIME_MS) };
      invites = invites.map((entry) => (entry.id === inviteId ? resent : entry));
      return resent;
    },

    revoke(inviteId) {
      findInvite(inviteId);
      invites = invites.filter((entry) => entry.id !== inviteId);
    },

    changeRole(memberId, role) {
      const member = findMember(memberId);
      const block = roleChangeBlock(members, memberId, role, actingUserId);
      if (block) throw new DataSourceError("invalid_input", block);
      const changed = { ...member, role };
      members = members.map((entry) => (entry.id === memberId ? changed : entry));
      return changed;
    },

    remove(memberId) {
      findMember(memberId);
      const block = removalBlock(members, memberId, actingUserId);
      if (block) throw new DataSourceError("invalid_input", block);
      members = members.filter((entry) => entry.id !== memberId);
    },
  };
}
