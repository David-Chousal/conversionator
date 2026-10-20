import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { changeRoleAction, inviteMembersAction, removeMemberAction, resendInviteAction, revokeInviteAction } from "@/app/(app)/team/actions";
import { createTeamStore } from "@/lib/data/team-store";
import { inviteRows, memberRows } from "@/lib/data/team-view";
import { InviteDialog } from "./InviteDialog";
import { InviteList } from "./InviteList";
import { MemberList } from "./MemberList";
import { TeamBoard } from "./TeamBoard";

vi.mock("@/app/(app)/team/actions", () => ({
  inviteMembersAction: vi.fn(async (emails: string[]) => ({ ok: true, data: emails.map((email) => ({ id: email, email })) })),
  resendInviteAction: vi.fn(async () => ({ ok: true, data: {} })),
  revokeInviteAction: vi.fn(async () => ({ ok: true, data: null })),
  changeRoleAction: vi.fn(async () => ({ ok: true, data: null })),
  removeMemberAction: vi.fn(async () => ({ ok: true, data: null })),
}));

const NOW = Date.parse("2026-03-30T17:00:00Z");
const store = createTeamStore(() => NOW, "u_david");
const members = memberRows(store.members(), "u_david", NOW);
const invites = inviteRows(store.invites(), NOW);
const emails = { members: store.members().map((m) => m.email), invites: store.invites().map((i) => i.email) };
const withToaster = (ui: React.ReactNode) => render(<Toaster>{ui}</Toaster>);
const row = (text: string) => screen.getAllByRole("row").find((r) => r.textContent?.includes(text))!;

beforeEach(() => vi.clearAllMocks());

describe("MemberList", () => {
  test("changes another member's role inline", async () => {
    withToaster(<MemberList members={members} canManage />);
    await act(async () => fireEvent.change(screen.getByLabelText("Role for Troy Edwards"), { target: { value: "admin" } }));
    expect(changeRoleAction).toHaveBeenCalledWith("u_troy", "admin");
    expect(screen.getByRole("status").textContent).toContain("Troy Edwards is now an admin");
  });

  test("shows your own row without controls", () => {
    withToaster(<MemberList members={members} canManage />);
    const you = row("David Chousal");
    expect(within(you).getByText("You")).toBeDefined();
    expect(within(you).queryByRole("combobox")).toBeNull();
    expect(within(you).queryByRole("button")).toBeNull();
  });

  test("removes a member only after holding the key", async () => {
    vi.useFakeTimers();
    withToaster(<MemberList members={members} canManage />);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Hold to remove Troy Edwards" }));
    await act(async () => vi.advanceTimersByTime(950));
    expect(removeMemberAction).toHaveBeenCalledWith("u_troy");
    expect(screen.getByRole("status").textContent).toContain("Removed Troy Edwards");
    vi.useRealTimers();
  });

  test("is read-only for members", () => {
    withToaster(<MemberList members={members} canManage={false} />);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /Hold to remove/ })).toBeNull();
  });
});

describe("InviteList", () => {
  test("resends and revokes invitations", async () => {
    withToaster(<InviteList invites={invites} canManage />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Resend invitation to maria@northwind.co" })));
    expect(resendInviteAction).toHaveBeenCalledWith("inv_maria");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Revoke invitation for jordan@northwind.co" })));
    expect(revokeInviteAction).toHaveBeenCalledWith("inv_jordan");
  });

  test("marks expired invitations", () => {
    withToaster(<InviteList invites={invites} canManage />);
    expect(within(row("jordan@northwind.co")).getByText("Expired")).toBeDefined();
    expect(within(row("maria@northwind.co")).getByText("Expires 4d")).toBeDefined();
  });
});

describe("InviteDialog", () => {
  afterEach(() => vi.useRealTimers());

  function renderDialog() {
    const onClose = vi.fn();
    withToaster(<InviteDialog open workspaceName="Northwind" existing={emails} onClose={onClose} />);
    return { onClose, input: screen.getByLabelText("Emails") };
  }

  test("turns typed addresses into tokens and flags the ones it can't invite", () => {
    const { input } = renderDialog();
    fireEvent.change(input, { target: { value: "sam@northwind.co, bad@x" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByText("sam@northwind.co")).toBeDefined();
    expect(screen.getByText("bad@x").closest(".cor-token")?.className).toContain("cor-token--invalid");
    expect(screen.getByText(/bad@x isn't a full email address/)).toBeDefined();
    expect((screen.getByRole("button", { name: /Send invite/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("sends the invitations with the chosen role", async () => {
    const { input, onClose } = renderDialog();
    fireEvent.change(input, { target: { value: "sam@northwind.co" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("radio", { name: /Admin/ }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Send invite/ })));
    expect(inviteMembersAction).toHaveBeenCalledWith(["sam@northwind.co"], "admin");
    expect(onClose).toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain("Invitation sent to sam@northwind.co");
  });

  test("removes a token with its button or Backspace", () => {
    const { input } = renderDialog();
    fireEvent.change(input, { target: { value: "a@northwind.co b@northwind.co" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Remove a@northwind.co" }));
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(screen.queryByText("a@northwind.co")).toBeNull();
    expect(screen.queryByText("b@northwind.co")).toBeNull();
  });
});

describe("TeamBoard", () => {
  test("opens the invite dialog from the Members bay", () => {
    withToaster(<TeamBoard members={members} invites={invites} existing={emails} canManage workspaceName="Northwind" />);
    fireEvent.click(screen.getByRole("button", { name: /Invite member/ }));
    expect(screen.getByRole("dialog", { name: "Invite to Northwind" })).toBeDefined();
  });

  test("tells members who can manage the team", () => {
    withToaster(<TeamBoard members={members} invites={invites} existing={emails} canManage={false} workspaceName="Northwind" />);
    expect(screen.getByText(/Only admins can invite/)).toBeDefined();
    expect(screen.queryByRole("button", { name: /Invite member/ })).toBeNull();
  });
});
