import { connection } from "next/server";
import { buildSources, parseRecordQuery, selectDataset, selectSource, type SourceItem } from "./data-sources-view";
import { CRM_SOURCE_ID, type DatasetSummary } from "./datasets";
import { dataSource } from "./index";
import type { RecordPage, RecordQuery } from "./mock-records";

type Query = Record<string, string | string[] | undefined>;

export type DataPageData =
  | { state: "empty" }
  | {
      state: "ready";
      sources: SourceItem[];
      source: SourceItem;
      datasets: DatasetSummary[];
      datasetId: string | null;
      records: RecordPage | null;
      recordQuery: RecordQuery;
      totalRecords: number;
      canManage: boolean;
      currency: string;
    };

const counts = (datasets: DatasetSummary[]) => ({ enabled: datasets.filter((dataset) => dataset.enabled).length, total: datasets.length });

/** Sources, the selected source's datasets, and one page of the selected dataset. Request time only. */
export async function loadDataPage(query: Query): Promise<DataPageData> {
  await connection();
  const [connections, crm, user, workspace] = await Promise.all([dataSource.listConnections(), dataSource.getCrm(), dataSource.getCurrentUser(), dataSource.getWorkspace()]);
  const crmDatasets = crm.status === "available" ? null : await dataSource.listDatasets(CRM_SOURCE_ID);
  const sources = buildSources(connections, crm, crmDatasets ? counts(crmDatasets) : null, Date.now());
  const source = selectSource(sources, query);
  if (!source) return { state: "empty" };

  const datasets = source.id === CRM_SOURCE_ID && crmDatasets ? crmDatasets : await dataSource.listDatasets(source.id);
  const requested = Array.isArray(query.dataset) ? query.dataset[0] : query.dataset;
  const datasetId = selectDataset(datasets, requested);
  const recordQuery = parseRecordQuery(query);
  const records = datasetId ? await dataSource.listRecords(source.id, datasetId, recordQuery) : null;
  return {
    state: "ready", sources, source, datasets, datasetId, records, recordQuery,
    totalRecords: datasets.reduce((sum, dataset) => sum + (dataset.records ?? 0), 0),
    canManage: user.role === "admin",
    currency: workspace.currency,
  };
}
