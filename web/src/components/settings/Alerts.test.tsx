import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { deleteAlertAction, saveAlertAction, setAlertPausedAction } from "@/app/(app)/settings/actions";
import { addDays, type IsoDate } from "@/lib/analytics/dates";
import { EMPTY_TOTALS } from "@/lib/analytics/metrics";
import { alertFeed, alertRows } from "@/lib/data/settings-view";
import type { AlertRule, AlertSeries } from "@/lib/data";
import { AlertsPanel } from "./AlertsPanel";

vi.mock("@/app/(app)/settings/actions", () => ({
  saveAlertAction: vi.fn(async (id: string | null, draft: object) => ({ ok: true, data: { ...draft, id: id ?? "a_new", slackChannel: null, ownerId: "u_david", ownerName: "David Chousal", paused: false, createdAt: "" } })),
  setAlertPausedAction: vi.fn(async () => ({ ok: true, data: null })),
  deleteAlertAction: vi.fn(async () => ({ ok: true, data: null })),
}));

const TODAY = "2026-10-18" as IsoDate;
const spend = [500, 900, 500, 500, 900, 500];
const series: AlertSeries = {
  source: "crm", currency: "USD", today: TODAY,
  days: spend.flatMap((value, i) => ["meta-ads", "google-ads"].map((platform) => ({ date: addDays(TODAY, i - 5), platform: platform as "meta-ads", totals: { ...EMPTY_TOTALS, spend: value, revenue: value * 3, impressions: 10, leads: 20 } }))),
};
const rule = (id: string, extra: Partial<AlertRule> = {}): AlertRule => ({ id, metric: "spend", platform: "meta-ads", condition: "above", threshold: 800, period: "day", delivery: "email", slackChannel: null, scope: "workspace", ownerId: "u_dakota", ownerName: "Dakota Goldstein", paused: false, createdAt: "2026-09-01T00:00:00Z", ...extra });
const rules = [rule("a_spend"), rule("a_mine", { scope: "personal", ownerId: "u_troy", ownerName: "Troy Edwards", metric: "roas", condition: "below", threshold: 2, delivery: "inApp" })];

function renderPanel(role: "admin" | "member" = "admin") {
  const actor = { id: role === "admin" ? "u_david" : "u_troy", role };
  return render(<Toaster><AlertsPanel alerts={alertRows(rules, actor, series)} feed={alertFeed(rules, series)} series={series} canManage={role === "admin"} /></Toaster>);
}
const row = (text: string) => screen.getAllByRole("row").find((entry) => entry.textContent?.includes(text))!;

beforeEach(() => vi.clearAllMocks());

describe("AlertsPanel", () => {
  test("lists rules as sentences with who owns them and how often they fired", () => {
    renderPanel();
    const spendRow = row("Ad spend on Meta Ads");
    expect(spendRow.textContent).toContain("Workspace · Dakota G.");
    expect(spendRow.textContent).toContain("Fired 2×");
  });

  test("builds a new alert slot by slot, with a backtest, and saves it", async () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /New alert/ }));
    const save = screen.getByRole("button", { name: "Save alert" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Metric"), { target: { value: "spend" } });
    fireEvent.change(screen.getByLabelText("Channel"), { target: { value: "google-ads" } });
    fireEvent.change(screen.getByLabelText("Condition"), { target: { value: "above" } });
    fireEvent.change(screen.getByLabelText("Threshold"), { target: { value: "800" } });
    fireEvent.change(screen.getByLabelText("Delivery"), { target: { value: "slack" } });
    fireEvent.change(screen.getByLabelText("Slack channel"), { target: { value: "#growth" } });
    expect(screen.getByText("Would have fired 2 times in the last 30 days")).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: "Everyone in the workspace" }));
    await act(async () => fireEvent.click(save));
    expect(saveAlertAction).toHaveBeenCalledWith(null, { metric: "spend", platform: "google-ads", condition: "above", threshold: 800, period: "day", delivery: "slack", slackChannel: "#growth", scope: "workspace" });
    expect(screen.getByRole("status").textContent).toContain("Alert saved");
  });

  test("adds the # to a Slack channel when you leave the slot", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /New alert/ }));
    fireEvent.change(screen.getByLabelText("Delivery"), { target: { value: "slack" } });
    const channel = screen.getByLabelText("Slack channel") as HTMLInputElement;
    fireEvent.change(channel, { target: { value: "Growth" } });
    fireEvent.blur(channel);
    expect(channel.value).toBe("#growth");
  });

  test("flags a bad threshold on its slot after leaving it", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: /New alert/ }));
    const threshold = screen.getByLabelText("Threshold");
    fireEvent.change(threshold, { target: { value: "0" } });
    fireEvent.blur(threshold);
    expect(threshold.className).toContain("cor-slot--invalid");
    expect(screen.getByText("Use a number above 0.")).toBeDefined();
  });

  test("edits an existing alert in the builder", async () => {
    renderPanel();
    fireEvent.click(within(row("Ad spend on Meta Ads")).getByRole("button", { name: /Edit/ }));
    fireEvent.change(screen.getByLabelText("Threshold"), { target: { value: "950" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save alert" })));
    expect(vi.mocked(saveAlertAction).mock.calls[0]).toEqual(["a_spend", expect.objectContaining({ threshold: 950, scope: "workspace" })]);
  });

  test("pauses an alert from its switch", async () => {
    renderPanel();
    await act(async () => fireEvent.click(within(row("Ad spend on Meta Ads")).getByRole("checkbox")));
    expect(setAlertPausedAction).toHaveBeenCalledWith("a_spend", true);
  });

  test("deletes with a hold", async () => {
    vi.useFakeTimers();
    renderPanel();
    fireEvent.pointerDown(within(row("Ad spend on Meta Ads")).getByRole("button", { name: /Hold to delete/ }));
    await act(async () => vi.advanceTimersByTime(950));
    vi.useRealTimers();
    expect(deleteAlertAction).toHaveBeenCalledWith("a_spend");
  });

  test("members can't change workspace alerts or create them", () => {
    renderPanel("member");
    expect(within(row("Ad spend on Meta Ads")).queryByRole("checkbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /New alert/ }));
    expect(screen.queryByRole("radio", { name: "Everyone in the workspace" })).toBeNull();
    expect(screen.getByText(/only you get it/)).toBeDefined();
  });

  test("shows what fired recently", () => {
    renderPanel();
    const feed = screen.getByRole("region", { name: "Recent alerts" });
    expect(within(feed).getAllByText("Ad spend on Meta Ads rose to $900 (above $800)")).toHaveLength(2);
    expect(within(feed).getByText("Yesterday")).toBeDefined();
  });
});
