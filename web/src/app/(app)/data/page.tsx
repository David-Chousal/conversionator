import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DatasetList } from "@/components/data/DatasetList";
import { RecordsTable } from "@/components/data/RecordsTable";
import { SourceDetail } from "@/components/data/SourceDetail";
import { SourceList } from "@/components/data/SourceList";
import { Banner } from "@/components/feedback/Banner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { loadDataPage } from "@/lib/data/data-loader";

export const metadata: Metadata = { title: "Data" };

async function DataContent({ searchParams }: { searchParams: PageProps<"/data">["searchParams"] }) {
  const data = await loadDataPage(await searchParams);
  if (data.state === "empty") {
    return (
      <EmptyState status="No signal · 0 sources" title="Nothing is patched in yet."
        action={<Link className="cor-key cor-key--primary" href="/connections"><Icon name="connections" />Connect a platform <kbd>G C</kbd></Link>}>
        Connect an ad platform and its campaigns, ads and daily spend will show up here.
      </EmptyState>
    );
  }
  const dataset = data.datasets.find((entry) => entry.id === data.datasetId);
  return (
    <div className="cor-data">
      <SourceList sources={data.sources} selectedId={data.source.id} />
      <div className="cor-data__detail">
        <SourceDetail source={data.source} canManage={data.canManage} totalRecords={data.totalRecords} />
        {!data.canManage && <Banner tone="info" icon="lock">Only admins can change which datasets COR pulls, sync or remove sources.</Banner>}
        <DatasetList sourceId={data.source.id} datasets={data.datasets} selectedId={data.datasetId} canManage={data.canManage} />
        {dataset && data.records && (
          <RecordsTable sourceId={data.source.id} sourceName={data.source.name} dataset={{ id: dataset.id, name: dataset.name }} page={data.records} search={data.recordQuery.search} currency={data.currency} />
        )}
      </div>
    </div>
  );
}

function DataSkeleton() {
  return (
    <div className="cor-data" aria-busy="true" aria-label="Loading data sources">
      <section className="cor-bay"><div className="cor-bay__head"><span className="cor-bay__title">Sources</span><span className="cor-tag">Checking…</span></div><span className="cor-skel" style={{ height: 160 }} /></section>
      <section className="cor-bay"><div className="cor-bay__head"><span className="cor-bay__title">Datasets</span></div><span className="cor-skel" style={{ height: 240 }} /></section>
    </div>
  );
}

export default function DataPage(props: PageProps<"/data">) {
  return (
    <>
      <PageHeader title="Data" />
      <main className="cor-main">
        <Suspense fallback={<DataSkeleton />}>
          <DataContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
