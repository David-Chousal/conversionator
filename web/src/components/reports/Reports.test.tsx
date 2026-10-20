import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { deleteReportAction, previewReportAction, saveReportAction } from "@/app/(app)/reports/actions";
import { fixtureReport } from "@/lib/analytics/fixtures";
import { buildReportContent } from "@/lib/reports/content";
import type { ComposerData } from "@/lib/reports/loader";
import type { ReportInput } from "@/lib/reports/types";
import type { ReportRow } from "@/lib/reports/view";
import { ReportComposer } from "./ReportComposer";
import { ReportList } from "./ReportList";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: push, refresh: vi.fn() }) }));

const input: ReportInput = { name: "March review", metrics: ["spend", "roas"], platforms: ["google-ads", "meta-ads"], window: { kind: "rolling", days: 30 }, compare: true, format: "pdf", schedule: "none", recipients: [] };
const content = buildReportContent(input, fixtureReport(), "2026-03-30");

vi.mock("@/app/(app)/reports/actions", () => ({
  previewReportAction: vi.fn(async () => ({ ok: true, data: content })),
  saveReportAction: vi.fn(async (_id: string | null, report: object) => ({ ok: true, data: { ...report, id: "r_new" } })),
  deleteReportAction: vi.fn(async () => ({ ok: true, data: null })),
}));

const composer = (patch: Partial<ComposerData> = {}): ComposerData => ({
  reportId: null, initial: { ...input, name: "" }, canEdit: true, source: "crm", weekStart: "monday", today: "2026-03-30", preview: content,
  channels: [{ platform: "google-ads", name: "Google Ads" }, { platform: "meta-ads", name: "Meta Ads" }, { platform: "linkedin-ads", name: "LinkedIn Ads" }],
  metrics: [{ key: "spend", label: "Ad spend", needsCrm: false }, { key: "roas", label: "ROAS", needsCrm: false }, { key: "leads", label: "Leads", needsCrm: false }],
  ...patch,
});
const renderComposer = (patch: Partial<ComposerData> = {}) => render(<Toaster><ReportComposer {...composer(patch)} /></Toaster>);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => vi.useRealTimers());

describe("ReportList", () => {
  const rows: ReportRow[] = [
    { id: "r_monthly", name: "Monthly performance", contents: "4 metrics · Google Ads · Last month", schedule: "Monthly · 1st 8:00", next: "Next Nov 1 · 2 recipients", format: "PDF", owner: "David C.", issue: null, canEdit: true },
    { id: "r_other", name: "LinkedIn review", contents: "3 metrics · LinkedIn Ads · Last 90 days", schedule: null, next: "Not scheduled", format: "PDF", owner: "Troy E.", issue: "LinkedIn Ads isn't connected anymore.", canEdit: false },
  ];

  test("shows what each report holds and when it goes out", () => {
    render(<Toaster><ReportList rows={rows} /></Toaster>);
    const monthly = screen.getAllByRole("row").find((row) => row.textContent?.includes("Monthly performance"))!;
    expect(within(monthly).getByRole("link", { name: "Monthly performance" }).getAttribute("href")).toBe("/reports/r_monthly");
    expect(monthly.textContent).toContain("Monthly · 1st 8:00");
    expect(screen.getByText("LinkedIn Ads isn't connected anymore.")).toBeDefined();
  });

  test("deletes with a hold, only where allowed", async () => {
    render(<Toaster><ReportList rows={rows} /></Toaster>);
    expect(screen.getAllByRole("button", { name: /Hold to delete/ })).toHaveLength(1);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Hold to delete Monthly performance" }));
    await act(async () => vi.advanceTimersByTime(950));
    expect(deleteReportAction).toHaveBeenCalledWith("r_monthly");
  });
});

describe("ReportComposer", () => {
  test("redraws the preview shortly after a change", async () => {
    renderComposer();
    fireEvent.click(screen.getByRole("checkbox", { name: "Leads" }));
    await act(async () => vi.advanceTimersByTime(400));
    expect(vi.mocked(previewReportAction).mock.calls[0][0]).toMatchObject({ metrics: ["spend", "roas", "leads"] });
  });

  test("shows the paper preview with the report's numbers", () => {
    renderComposer();
    const paper = screen.getByRole("region", { name: "Preview" });
    expect(within(paper).getByText("By channel")).toBeDefined();
    expect(within(paper).getAllByText(content.summary[0].value).length).toBeGreaterThan(0);
  });

  test("saves a new report and opens it", async () => {
    renderComposer();
    fireEvent.change(screen.getByLabelText("Report name"), { target: { value: "March review" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save report" })));
    expect(saveReportAction).toHaveBeenCalledWith(null, expect.objectContaining({ name: "March review", metrics: ["spend", "roas"] }));
    expect(push).toHaveBeenCalledWith("/reports/r_new");
  });

  test("asks for a name before saving", async () => {
    renderComposer();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Save report" })));
    expect(saveReportAction).not.toHaveBeenCalled();
    expect(screen.getByText("Name the report.")).toBeDefined();
  });

  test("scheduling asks for recipients", async () => {
    renderComposer();
    fireEvent.click(screen.getByRole("radio", { name: "Weekly" }));
    const recipients = screen.getByLabelText("Recipients");
    fireEvent.change(recipients, { target: { value: "ops@northwind.co, bad" } });
    fireEvent.keyDown(recipients, { key: "Enter" });
    expect(screen.getByText("bad isn't a full email address.")).toBeDefined();
    expect(screen.getByText(/Weekly · Mondays 8:00/)).toBeDefined();
  });

  test("exports the file the format names", async () => {
    const blob = new Blob(["csv"], { type: "text/csv" });
    const fetchMock = vi.fn(async () => new Response(blob, { headers: { "Content-Disposition": 'attachment; filename="march-review.csv"' } }));
    vi.stubGlobal("fetch", fetchMock);
    URL.createObjectURL = vi.fn(() => "blob:report");
    URL.revokeObjectURL = vi.fn();
    renderComposer();
    fireEvent.click(screen.getByRole("radio", { name: "CSV" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Export CSV" })));
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toMatchObject({ format: "csv" });
    expect(screen.getByRole("status").textContent).toContain("march-review.csv");
    vi.unstubAllGlobals();
  });

  test("a failed export keeps everything and offers Retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ message: "No data for Mar 1 → Mar 30 on Meta Ads." }, { status: 422 })));
    renderComposer();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Export PDF" })));
    expect(screen.getByText("No data for Mar 1 → Mar 30 on Meta Ads.")).toBeDefined();
    expect(screen.getByRole("button", { name: "Retry" })).toBeDefined();
    vi.unstubAllGlobals();
  });

  test("an empty window says so in the preview and can't export", () => {
    renderComposer({ preview: { ...content, empty: true } });
    expect(screen.getByText(/No data for Mar 1 → Mar 30/)).toBeDefined();
    expect((screen.getByRole("button", { name: "Export PDF" }) as HTMLButtonElement).disabled).toBe(true);
  });

  test("keeps its choices when another composer is in the page (Next keeps hidden copies of past pages)", () => {
    render(<Toaster><ReportComposer {...composer()} /><ReportComposer {...composer()} /></Toaster>);
    const [first, second] = screen.getAllByRole("radio", { name: "Last 30 days" }) as HTMLInputElement[];
    expect(first.name).not.toBe(second.name);
  });

  test("people who can't edit see it read-only but can still export", () => {
    renderComposer({ reportId: "r_other", canEdit: false, initial: input });
    expect(screen.queryByRole("button", { name: "Save report" })).toBeNull();
    expect(screen.getByText(/Only its owner or an admin can change this report/)).toBeDefined();
    expect(screen.getByRole("button", { name: "Export PDF" })).toBeDefined();
  });
});
