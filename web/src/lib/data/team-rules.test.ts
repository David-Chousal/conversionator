import { describe, expect, test } from "vitest";
import { checkInviteEmails, removalBlock, roleChangeBlock, splitEmails } from "./team-rules";
import type { Member } from "./team-types";

const members: Member[] = [
  { id: "u_david", name: "David Chousal", email: "dchousal@northwind.co", role: "admin", initials: "DC", lastActiveAt: null },
  { id: "u_dakota", name: "Dakota Goldstein", email: "dagoldstein@northwind.co", role: "admin", initials: "DG", lastActiveAt: null },
  { id: "u_troy", name: "Troy Edwards", email: "tedwards@northwind.co", role: "member", initials: "TE", lastActiveAt: null },
];
const invites = [{ email: "maria@northwind.co" }];

describe("splitEmails", () => {
  test("splits on commas, semicolons, spaces and new lines, dropping blanks", () => {
    expect(splitEmails("a@x.co, b@x.co;c@x.co\n d@x.co  ")).toEqual(["a@x.co", "b@x.co", "c@x.co", "d@x.co"]);
  });
});

describe("checkInviteEmails", () => {
  test("accepts new, well-formed addresses, lowercased and deduplicated", () => {
    expect(checkInviteEmails(["Sam@Northwind.co", "sam@northwind.co"], members, invites)).toEqual({ valid: ["sam@northwind.co"], problems: [] });
  });

  test("explains each address it can't invite", () => {
    const result = checkInviteEmails(["sam@northwind", "TEDWARDS@northwind.co", "maria@northwind.co"], members, invites);
    expect(result.valid).toEqual([]);
    expect(result.problems).toEqual([
      { email: "sam@northwind", reason: "isn't a full email address" },
      { email: "tedwards@northwind.co", reason: "is already in the workspace" },
      { email: "maria@northwind.co", reason: "already has an invitation; resend it instead" },
    ]);
  });

  test("limits a batch to 20 addresses", () => {
    const many = Array.from({ length: 21 }, (_, i) => `p${i}@northwind.co`);
    expect(checkInviteEmails(many, members, invites).problems.at(-1)?.reason).toMatch(/20/);
  });
});

describe("roleChangeBlock", () => {
  test("blocks changing your own role", () => {
    expect(roleChangeBlock(members, "u_david", "member", "u_david")).toMatch(/your own role/);
  });

  test("blocks demoting the last admin", () => {
    const oneAdmin = members.map((m) => (m.id === "u_dakota" ? { ...m, role: "member" as const } : m));
    expect(roleChangeBlock(oneAdmin, "u_david", "member", "u_troy")).toMatch(/at least one admin/);
  });

  test("allows other changes", () => {
    expect(roleChangeBlock(members, "u_troy", "admin", "u_david")).toBeNull();
    expect(roleChangeBlock(members, "u_dakota", "member", "u_david")).toBeNull();
  });
});

describe("removalBlock", () => {
  test("blocks removing yourself or the last admin", () => {
    expect(removalBlock(members, "u_david", "u_david")).toMatch(/yourself/);
    const oneAdmin = members.map((m) => (m.id === "u_dakota" ? { ...m, role: "member" as const } : m));
    expect(removalBlock(oneAdmin, "u_david", "u_troy")).toMatch(/at least one admin/);
    expect(removalBlock(members, "u_troy", "u_david")).toBeNull();
  });
});
