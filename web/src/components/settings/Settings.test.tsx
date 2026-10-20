import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { updateNotificationsAction, updateProfileAction, updateWorkspaceAction } from "@/app/(app)/settings/actions";
import { NOTIFICATION_CHANNELS } from "@/lib/data/settings-store";
import type { NotificationPrefs, User, Workspace } from "@/lib/data";
import { GeneralForm } from "./GeneralForm";
import { NotificationsForm } from "./NotificationsForm";
import { SettingsTabs } from "./SettingsTabs";
import { WorkspaceForm } from "./WorkspaceForm";

vi.mock("@/app/(app)/settings/actions", () => ({
  updateProfileAction: vi.fn(async () => ({ ok: true, data: null })),
  updateWorkspaceAction: vi.fn(async () => ({ ok: true, data: null })),
  updateNotificationsAction: vi.fn(async () => ({ ok: true, data: null })),
}));

const user: User = { id: "u_david", name: "David Chousal", email: "dchousal@northwind.co", role: "admin", initials: "DC" };
const workspace: Workspace = { id: "ws", name: "Northwind", currency: "USD", timeZone: "America/Los_Angeles", weekStart: "monday" };
const prefs: NotificationPrefs = { alerts: { inApp: true, email: true }, sync: { inApp: true, email: false }, team: { inApp: true, email: false }, summary: { inApp: false, email: true } };
const withToaster = (ui: React.ReactNode) => render(<Toaster>{ui}</Toaster>);
const save = () => act(async () => fireEvent.click(screen.getByRole("button", { name: "Save" })));

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.useRealTimers());

describe("SettingsTabs", () => {
  test("links each section and marks the open one", () => {
    render(<SettingsTabs active="alerts" />);
    expect(screen.getByRole("link", { name: "Alerts" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "CRM" }).getAttribute("href")).toBe("/settings?tab=crm");
  });
});

describe("GeneralForm", () => {
  test("saves the name and default range, then says Saved", async () => {
    withToaster(<GeneralForm user={user} defaultRangeDays={30} workspace={workspace} canManage />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "David C." } });
    fireEvent.click(screen.getByRole("radio", { name: "Last 7 days" }));
    await save();
    expect(updateProfileAction).toHaveBeenCalledWith({ name: "David C.", defaultRangeDays: 7 });
    expect(screen.getByRole("button", { name: "Saved" })).toBeDefined();
  });

  test("shows the error under the field and moves focus there instead of saving", async () => {
    withToaster(<GeneralForm user={user} defaultRangeDays={30} workspace={workspace} canManage />);
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: " " } });
    await save();
    expect(updateProfileAction).not.toHaveBeenCalled();
    expect(screen.getByText("Enter your name.")).toBeDefined();
    expect(document.activeElement).toBe(screen.getByLabelText("Name"));
  });

  test("keeps its choice when another copy is in the page", () => {
    withToaster(<><GeneralForm user={user} defaultRangeDays={30} workspace={workspace} canManage /><GeneralForm user={user} defaultRangeDays={30} workspace={workspace} canManage /></>);
    const [first, second] = screen.getAllByRole("radio", { name: "Last 30 days" }) as HTMLInputElement[];
    expect(first.name).not.toBe(second.name);
  });

  test("explains that time zone and currency belong to the workspace", () => {
    withToaster(<GeneralForm user={user} defaultRangeDays={30} workspace={workspace} canManage={false} />);
    expect(screen.getByText(/Pacific · Los Angeles/)).toBeDefined();
    expect(screen.getByText(/US dollar/)).toBeDefined();
  });
});

describe("WorkspaceForm", () => {
  test("admins change currency, time zone and week start", async () => {
    withToaster(<WorkspaceForm workspace={workspace} canManage />);
    fireEvent.change(screen.getByLabelText("Currency"), { target: { value: "EUR" } });
    fireEvent.change(screen.getByLabelText("Time zone"), { target: { value: "Europe/London" } });
    fireEvent.click(screen.getByRole("radio", { name: "Sunday" }));
    await save();
    expect(updateWorkspaceAction).toHaveBeenCalledWith({ name: "Northwind", currency: "EUR", timeZone: "Europe/London", weekStart: "sunday" });
  });

  test("members see it read-only", () => {
    withToaster(<WorkspaceForm workspace={workspace} canManage={false} />);
    expect((screen.getByLabelText("Currency") as HTMLSelectElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    expect(screen.getByText(/Only admins can change workspace settings/)).toBeDefined();
  });
});

describe("NotificationsForm", () => {
  test("toggles a channel and saves", async () => {
    withToaster(<NotificationsForm prefs={prefs} channels={NOTIFICATION_CHANNELS} weekStart="monday" canManage />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Sync problems by email" }));
    await save();
    expect(vi.mocked(updateNotificationsAction).mock.calls[0][0]).toMatchObject({ sync: { inApp: true, email: true } });
  });

  test("offers only the channels an event has, and hides team notices from members", () => {
    withToaster(<NotificationsForm prefs={prefs} channels={NOTIFICATION_CHANNELS} weekStart="sunday" canManage={false} />);
    const summary = screen.getAllByRole("row").find((row) => row.textContent?.includes("Weekly summary"))!;
    expect(within(summary).queryByRole("checkbox", { name: /in-app/ })).toBeNull();
    expect(summary.textContent).toContain("every Sunday");
    expect(screen.queryByText(/joins the workspace/)).toBeNull();
  });
});
