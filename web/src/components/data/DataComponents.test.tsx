import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Toaster } from "@/components/feedback/Toaster";
import { removeSourceAction, setDatasetEnabledAction, syncSourceAction } from "@/app/(app)/data/actions";
import { buildSources } from "@/lib/data/data-sources-view";
import { createCrmStore } from "@/lib/data/crm-store";
import { createMockStore } from "@/lib/data/mock-store";
import { mockRecords } from "@/lib/data/mock-records";
import type { DatasetSummary } from "@/lib/data/datasets";
import { DatasetList } from "./DatasetList";
import { RecordsTable } from "./RecordsTable";
import { SourceDetail } from "./SourceDetail";
import { SourceList } from "./SourceList";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));
vi.mock("@/app/(app)/data/actions", () => ({
  setDatasetEnabledAction: vi.fn(async () => ({ ok: true, data: null })),
  syncSourceAction: vi.fn(async () => ({ ok: true, data: { rows: 4120, finishedAt: "2026-03-30T17:00:00Z" } })),
  removeSourceAction: vi.fn(async () => ({ ok: true, data: null })),
}));

const NOW = Date.parse("2026-03-30T17:00:00Z");
const sources = buildSources(createMockStore(() => NOW, { revoked: ["linkedin-ads"] }).listConnections(), createCrmStore(() => NOW).get(), { enabled: 3, total: 3 }, NOW);
const google = sources[0];
const datasets: DatasetSummary[] = [
  { id: "campaigns", name: "Campaigns", description: "Every campaign.", enabled: true, pending: false, records: 4, updatedAt: "2026-03-30T16:56:00Z" },
  { id: "search-terms", name: "Search terms", description: "What people searched.", enabled: true, pending: true, records: null, updatedAt: null },
  { id: "audiences", name: "Audiences", description: "Audiences.", enabled: false, pending: false, records: null, updatedAt: null },
];
const recordSource = { kind: "google-ads" as const, today: "2026-03-30", dataThrough: "2026-03-30", enabled: ["campaigns", "spend-daily"], pending: [] };

const withToaster = (ui: React.ReactNode) => render(<Toaster>{ui}</Toaster>);

beforeEach(() => {
  replace.mockClear();
  vi.mocked(setDatasetEnabledAction).mockClear();
});

describe("SourceList", () => {
  test("lists every source and marks the selected one", () => {
    render(<SourceList sources={sources} selectedId={google.id} />);
    const nav = screen.getByRole("navigation", { name: "Data sources" });
    expect(within(nav).getAllByRole("link")).toHaveLength(4);
    expect(within(nav).getByRole("link", { current: "page" }).textContent).toContain("Google Ads");
    expect(within(nav).getByRole("link", { name: /HubSpot/ }).getAttribute("href")).toBe("/data?source=crm-hubspot");
  });
});

describe("DatasetList", () => {
  test("turns a dataset off through its switch", async () => {
    withToaster(<DatasetList sourceId={google.id} datasets={datasets} selectedId="campaigns" canManage />);
    await act(async () => fireEvent.click(screen.getByRole("switch", { name: "Pull Campaigns" })));
    expect(setDatasetEnabledAction).toHaveBeenCalledWith(google.id, "campaigns", false);
  });

  test("shows datasets waiting for a sync and ones that are off", () => {
    withToaster(<DatasetList sourceId={google.id} datasets={datasets} selectedId="campaigns" canManage />);
    expect(screen.getByText("Waiting for next sync")).toBeDefined();
    expect(screen.getByText("Off")).toBeDefined();
  });

  test("locks required datasets on, saying why", () => {
    const required = [{ ...datasets[0], id: "contacts", name: "Contacts", required: "Attribution needs contacts to match leads to ads." }];
    withToaster(<DatasetList sourceId="crm-hubspot" datasets={required} selectedId="contacts" canManage />);
    expect((screen.getByRole("switch", { name: "Pull Contacts" }) as HTMLInputElement).disabled).toBe(true);
    expect(screen.getByText(/Attribution needs contacts/)).toBeDefined();
  });

  test("is read-only for members", () => {
    withToaster(<DatasetList sourceId={google.id} datasets={datasets} selectedId="campaigns" canManage={false} />);
    expect(screen.getAllByRole("switch").every((input) => (input as HTMLInputElement).disabled)).toBe(true);
  });
});

describe("RecordsTable", () => {
  function renderTable(page = mockRecords(recordSource, "spend-daily", { search: "", page: 1 }), search = "") {
    render(<RecordsTable sourceId={google.id} sourceName="Google Ads" dataset={{ id: "spend-daily", name: "Spend by day" }} page={page} search={search} currency="USD" />);
  }

  test("formats dates and money in their columns", () => {
    renderTable();
    const firstRow = screen.getAllByRole("row")[1];
    expect(within(firstRow).getAllByRole("cell")[0].textContent).toBe("Mar 30");
    expect(within(firstRow).getAllByRole("cell")[1].textContent).toMatch(/^\$/);
  });

  test("searches through the URL", () => {
    renderTable();
    fireEvent.change(screen.getByLabelText("Search Spend by day"), { target: { value: "mar" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(replace).toHaveBeenCalledWith(`/data?source=${google.id}&dataset=spend-daily&q=mar`, { scroll: false });
  });

  test("pages with links", () => {
    renderTable();
    expect(screen.getByText("Rows 1–25 of 90")).toBeDefined();
    expect(screen.getByRole("link", { name: "Next page" }).getAttribute("href")).toBe(`/data?source=${google.id}&dataset=spend-daily&page=2`);
  });

  test("explains an empty dataset", () => {
    renderTable(mockRecords({ ...recordSource, enabled: ["campaigns"] }, "spend-daily", { search: "", page: 1 }));
    expect(screen.getByText(/Spend by day is off/)).toBeDefined();
  });

  test("says when a search matches nothing, with a way back", () => {
    renderTable(mockRecords(recordSource, "campaigns", { search: "zzz", page: 1 }), "zzz");
    expect(screen.getByText(/No records match “zzz”/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Clear search" })).toBeDefined();
  });
});

describe("SourceDetail", () => {
  test("syncs on demand and reports the rows", async () => {
    withToaster(<SourceDetail source={google} canManage totalRecords={1200} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Sync now/ })));
    expect(syncSourceAction).toHaveBeenCalledWith(google.id);
    expect(screen.getByRole("status").textContent).toContain("Synced 4,120 rows from Google Ads");
  });

  test("offers Reconnect when the source failed", () => {
    withToaster(<SourceDetail source={sources[2]} canManage totalRecords={0} />);
    expect(screen.getByRole("link", { name: "Reconnect" }).getAttribute("href")).toBe(`/oauth/linkedin-ads?mode=reconnect&connection=${sources[2].id}`);
  });

  test("removes the source only after holding the key, deleting its records", async () => {
    vi.useFakeTimers();
    withToaster(<SourceDetail source={google} canManage totalRecords={1200} />);
    fireEvent.click(screen.getByRole("button", { name: "Google Ads actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove data source" }));
    expect(screen.getByRole("dialog", { name: "Remove Google Ads?" }).textContent).toContain("1,200 records");
    fireEvent.pointerDown(screen.getByRole("button", { name: "Hold to remove Google Ads" }));
    await act(async () => vi.advanceTimersByTime(950));
    expect(removeSourceAction).toHaveBeenCalledWith(google.id);
    expect(replace).toHaveBeenCalledWith("/data", { scroll: false });
    vi.useRealTimers();
  });

  test("hides actions from members", () => {
    withToaster(<SourceDetail source={google} canManage={false} totalRecords={1200} />);
    expect(screen.queryByRole("button", { name: /Sync now/ })).toBeNull();
  });
});
