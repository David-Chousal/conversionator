import { describe, expect, test } from "vitest";
import { createCrmStore } from "./crm-store";
import { buildSources, dataHref, parseRecordQuery, selectDataset, selectSource } from "./data-sources-view";
import { createMockStore } from "./mock-store";
import type { DatasetSummary } from "./datasets";

const NOW = Date.parse("2026-03-30T17:00:00Z");
const connections = createMockStore(() => NOW, { revoked: ["linkedin-ads"] }).listConnections();
const crm = createCrmStore(() => NOW).get();
const sources = buildSources(connections, crm, { enabled: 3, total: 3 }, NOW);

describe("buildSources", () => {
  test("lists connected ad platforms by channel code, then the CRM", () => {
    expect(sources.map((source) => [source.name, source.code])).toEqual([["Google Ads", "CH·01"], ["Meta Ads", "CH·02"], ["LinkedIn Ads", "CH·03"], ["HubSpot", "CRM"]]);
  });

  test("carries each source's signal and dataset counts", () => {
    expect(sources[0]).toMatchObject({ signal: { state: "ok" }, datasets: { enabled: 4, total: 6 } });
    expect(sources[2]).toMatchObject({ failed: true });
  });

  test("leaves the CRM out when it isn't connected", () => {
    expect(buildSources(connections, { ...crm, status: "available" }, null, NOW).some((source) => source.kind === "crm")).toBe(false);
  });
});

describe("selection", () => {
  test("selects by source id, then by platform, then the first source", () => {
    expect(selectSource(sources, { source: "crm-hubspot" })?.name).toBe("HubSpot");
    expect(selectSource(sources, { platform: "meta-ads" })?.name).toBe("Meta Ads");
    expect(selectSource(sources, { source: "nope" })?.name).toBe("Google Ads");
    expect(selectSource([], {})).toBeNull();
  });

  test("selects the requested dataset, else the first one that's on", () => {
    const datasets = [{ id: "search-terms", enabled: false }, { id: "campaigns", enabled: true }] as DatasetSummary[];
    expect(selectDataset(datasets, "search-terms")).toBe("search-terms");
    expect(selectDataset(datasets, "nope")).toBe("campaigns");
  });

  test("reads search and page safely", () => {
    expect(parseRecordQuery({ q: "  brand ", page: "3" })).toEqual({ search: "brand", page: 3 });
    expect(parseRecordQuery({ page: "-2" })).toEqual({ search: "", page: 1 });
    expect(parseRecordQuery({ q: "x".repeat(300) }).search).toHaveLength(100);
  });

  test("builds links that leave out empty parts", () => {
    expect(dataHref({ source: "con_google-ads", dataset: "ads" })).toBe("/data?source=con_google-ads&dataset=ads");
    expect(dataHref({ source: "con_google-ads", dataset: "ads", search: "rsa", page: 2 })).toBe("/data?source=con_google-ads&dataset=ads&q=rsa&page=2");
  });
});
