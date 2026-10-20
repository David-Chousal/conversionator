# MemberList

The member list is the Team page: who has access, their role, when they were last active, and invitations that haven't been accepted.

- Two bays. **Members**: avatar, name + email, role, last active, actions, with "5 people · 2 admins" and the primary "Invite member" key in the bay head. **Pending invites** (only when there are any): ghost avatar, the email as the name, "Invited by David C. on Oct 16", role badge, status, Resend and a revoke key.
- Both are `cor-table cor-team-table` with fixed tracks (role 160px, last active / status 140px, actions 184px) so members and invites line up column for column; only the name column flexes.
- Admins change roles inline with a compact Select (Admin, Member). Your own row shows "You" and a solid role badge; you can't change your own role or remove yourself. The workspace keeps at least one admin, so the last admin's role is a badge with a tooltip saying why.
- Remove is hold-to-confirm and ends with a toast: "Removed Troy Edwards. They lost access immediately." Role changes toast what the new role can do.
- Invite status is a `--pending` badge with time left rounded up ("Expires 7d" for a fresh invite, hours in the last day); an expired one is `--muted` "Expired" and can still be resent, which restarts its 7 days. Revoke is immediate: the link in their email stops working.
- Members see everything read-only, with a `--info` Banner: "Only admins can invite people, change roles or remove members."
- The invite Dialog ("Invite to Northwind"): a TokenInput labelled Emails (up to 20 at once, focused on open), then Admin / Member radios with one line each on what the role can do. Problems are flagged on the token as the admin types (not a full address, already in the workspace, already invited — resend instead) and Send stays disabled until they're removed. Send reads "Send 3 invites" for several.
- Phones (<768px): each row stacks the person above a role | status | actions grid with fixed tracks; members drop last active.
