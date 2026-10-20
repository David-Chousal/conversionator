"use client";

import Link from "next/link";
import { useTransition } from "react";
import { setDatasetEnabledAction } from "@/app/(app)/data/actions";
import { useToast } from "@/components/feedback/Toaster";
import { Icon } from "@/components/ui/Icon";
import { dataHref } from "@/lib/data/data-sources-view";
import type { DatasetSummary } from "@/lib/data/datasets";
import { formatCount } from "@/lib/format";

interface DatasetListProps {
  sourceId: string;
  datasets: DatasetSummary[];
  selectedId: string | null;
  canManage: boolean;
}

function RecordsCell({ dataset }: { dataset: DatasetSummary }) {
  if (!dataset.enabled) return <span className="cor-tag">Off</span>;
  if (dataset.pending) return <span className="cor-tag" style={{ color: "var(--caution)" }}>Waiting for next sync</span>;
  return <span className="cor-num">{dataset.records === null ? "—" : `${formatCount(dataset.records)} records`}</span>;
}

/** A source's datasets: what COR pulls, with a switch for each and its stored record count. */
export function DatasetList({ sourceId, datasets, selectedId, canManage }: DatasetListProps) {
  const { show } = useToast();
  const [busy, startTransition] = useTransition();

  function toggle(dataset: DatasetSummary, enabled: boolean) {
    startTransition(async () => {
      const result = await setDatasetEnabledAction(sourceId, dataset.id, enabled);
      if (!result.ok) return show({ tone: "failed", title: `Couldn't change ${dataset.name}`, detail: result.message });
      show(enabled
        ? { tone: "ok", title: `${dataset.name} is on`, detail: "Its records arrive with the next sync." }
        : { tone: "ok", title: `Stopped pulling ${dataset.name}`, detail: "Its stored records are removed and dashboards stop using them." });
    });
  }

  return (
    <section className="cor-bay" aria-label="Datasets">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">Datasets</h2>
        <span className="cor-tag">{datasets.filter((dataset) => dataset.enabled).length} of {datasets.length} pulled</span>
      </div>
      <div className="cor-list">
        <div className="cor-list__row cor-list__row--head cor-dataset" aria-hidden="true"><span className="cor-tag">Pull</span><span className="cor-tag">Dataset</span><span className="cor-tag">Stored</span></div>
        {datasets.map((dataset) => (
          <div key={dataset.id} className="cor-list__row cor-dataset">
            <label className="cor-switch">
              <input type="checkbox" role="switch" id={`dataset-${dataset.id}`} aria-label={`Pull ${dataset.name}`} checked={dataset.enabled}
                disabled={!canManage || Boolean(dataset.required) || busy} onChange={(event) => toggle(dataset, event.target.checked)} />
              <span className="cor-switch__state">{dataset.enabled ? "ON" : "OFF"}</span>
            </label>
            <span className="cor-list__main">
              <Link href={dataHref({ source: sourceId, dataset: dataset.id })} className="cor-dataset__name" aria-current={dataset.id === selectedId ? "true" : undefined}>{dataset.name}</Link>
              <span className="cor-dataset__desc">{dataset.description}</span>
              {dataset.required && <span className="cor-help"><Icon name="lock" />{dataset.required}</span>}
            </span>
            <RecordsCell dataset={dataset} />
          </div>
        ))}
      </div>
    </section>
  );
}
