import { describe, expect, test } from "vitest";
import { inviteRows, lastActiveLabel, memberRows } from "./team-view";
import type { Invite, Member } from "./team-types";

const NOW = Date.parse("2026-03-30T17:00:00Z");
const HOUR = 3_600_000;
const iso = (offset: number) => new Date(NOW + offset).toISOString();

describe("lastActiveLabel", () => {
  test("reads like a person would say it", () => {
    expect(lastActiveLabel(iso(-2 * 60_000), NOW)).toBe("Now");
    expect(lastActiveLabel(iso(-2 * HOUR), NOW)).toBe("2h ago");
    expect(lastActiveLabel(iso(-30 * HOUR), NOW)).toBe("Yesterday");
    expect(lastActiveLabel(iso(-5 * 24 * HOUR), NOW)).toBe("Mar 25");
    expect(lastActiveLabel(null, NOW)).toBe("Never");
  });
});

describe("memberRows", () => {
  const members: Member[] = [
    { id: "me", name: "David Chousal", email: "d@x.co", role: "admin", initials: "DC", lastActiveAt: iso(0) },
    { id: "t", name: "Troy Edwards", email: "t@x.co", role: "member", initials: "TE", lastActiveAt: iso(-2 * HOUR) },
  ];

  test("marks you and says why your row can't change", () => {
    const [me, troy] = memberRows(members, "me", NOW);
    expect(me).toMatchObject({ isYou: true, roleLocked: "You can't change your own role. Ask another admin.", removeBlocked: expect.stringMatching(/yourself/) });
    expect(troy).toMatchObject({ isYou: false, roleLocked: null, removeBlocked: null, lastActive: "2h ago" });
  });
});

describe("inviteRows", () => {
  const invites: Invite[] = [
    { id: "a", email: "maria@x.co", role: "member", invitedBy: "David Chousal", invitedAt: iso(-3 * 24 * HOUR), expiresAt: iso(4 * 24 * HOUR) },
    { id: "b", email: "jordan@x.co", role: "admin", invitedBy: "Dakota Goldstein", invitedAt: iso(-9 * 24 * HOUR), expiresAt: iso(-2 * 24 * HOUR) },
  ];

  test("shows who invited them, when, and how long is left", () => {
    expect(inviteRows(invites, NOW)).toEqual([
      expect.objectContaining({ id: "a", expired: false, status: "Expires 4d", detail: "Invited by David C. on Mar 27" }),
      expect.objectContaining({ id: "b", expired: true, status: "Expired", detail: "Invited by Dakota G. on Mar 21" }),
    ]);
  });

  test("rounds time left up, so a fresh invite reads 7d and the last hours read in hours", () => {
    const fresh: Invite = { ...invites[0], expiresAt: iso(7 * 24 * HOUR - 1000) };
    const closing: Invite = { ...invites[0], expiresAt: iso(90 * 60_000) };
    expect(inviteRows([fresh, closing], NOW).map((row) => row.status)).toEqual(["Expires 7d", "Expires 2h"]);
  });
});
