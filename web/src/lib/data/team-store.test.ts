import { beforeEach, describe, expect, test } from "vitest";
import { DataSourceError } from "./errors";
import { createTeamStore, INVITE_LIFETIME_MS, type TeamStore } from "./team-store";

const NOW = Date.parse("2026-03-30T17:00:00Z");
const ME = "u_david";

describe("team store", () => {
  let clock: number;
  let team: TeamStore;

  beforeEach(() => {
    clock = NOW;
    team = createTeamStore(() => clock, ME);
  });

  test("seeds members with you first, and one pending and one expired invite", () => {
    expect(team.members()[0]).toMatchObject({ id: ME, role: "admin" });
    expect(team.invites().map((invite) => invite.email)).toEqual(["maria@northwind.co", "jordan@northwind.co"]);
  });

  test("invites new addresses for 7 days", () => {
    const [invite] = team.invite(["Sam@Northwind.co"], "member");
    expect(invite).toMatchObject({ email: "sam@northwind.co", role: "member", invitedBy: "David Chousal" });
    expect(Date.parse(invite.expiresAt) - Date.parse(invite.invitedAt)).toBe(INVITE_LIFETIME_MS);
  });

  test("refuses the whole batch when any address has a problem", () => {
    expect(() => team.invite(["sam@northwind.co", "tedwards@northwind.co"], "member")).toThrowError(/tedwards@northwind.co is already in the workspace/);
    expect(team.invites()).toHaveLength(2);
  });

  test("refuses an empty batch", () => {
    expect(() => team.invite([], "member")).toThrowError(DataSourceError);
  });

  test("resending restarts the 7 days", () => {
    const expired = team.invites()[1];
    clock += 60_000;
    const resent = team.resend(expired.id);
    expect(Date.parse(resent.expiresAt)).toBe(clock + INVITE_LIFETIME_MS);
  });

  test("revokes an invitation", () => {
    team.revoke(team.invites()[0].id);
    expect(team.invites()).toHaveLength(1);
  });

  test("changes a member's role within the rules", () => {
    expect(team.changeRole("u_troy", "admin").role).toBe("admin");
    expect(() => team.changeRole(ME, "member")).toThrowError(/your own role/);
  });

  test("removes a member within the rules", () => {
    team.remove("u_troy");
    expect(team.members().some((member) => member.id === "u_troy")).toBe(false);
    expect(() => team.remove(ME)).toThrowError(/yourself/);
  });

  test("errors for unknown people", () => {
    expect(() => team.remove("nope")).toThrowError(DataSourceError);
    expect(() => team.resend("nope")).toThrowError(DataSourceError);
  });
});
