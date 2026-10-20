"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { Icon } from "@/components/ui/Icon";
import { dataHref } from "@/lib/data/data-sources-view";
import type { RecordPage } from "@/lib/data/mock-records";
import { formatCount } from "@/lib/format";
import { formatCell } from "./format-cell";

interface RecordsTableProps {
  sourceId: string;
  sourceName: string;
  dataset: { id: string; name: string };
  page: RecordPage;
  search: string;
  currency: string;
}

function emptyMessage(page: RecordPage, datasetName: string, sourceName: string, search: string): string {
  if (page.state === "off") return `${datasetName} is off. Turn it on to pull its records.`;
  if (page.state === "pending") return `${datasetName} is on. Its records arrive with the next sync.`;
  if (page.state === "not-synced") return `Waiting for ${sourceName}'s first sync.`;
  return search ? `No records match “${search}”.` : "No records yet.";
}

/** One page of a dataset's records, searchable, with links to other pages. */
export function RecordsTable({ sourceId, sourceName, dataset, page, search, currency }: RecordsTableProps) {
  const router = useRouter();
  const href = (next: { search?: string; page?: number }) => dataHref({ source: sourceId, dataset: dataset.id, search: next.search ?? search, page: next.page });
  const lastPage = Math.max(1, Math.ceil(page.total / page.pageSize));
  const from = (page.page - 1) * page.pageSize + 1;
  const to = Math.min(page.total, page.page * page.pageSize);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.replace(dataHref({ source: sourceId, dataset: dataset.id, search: value }), { scroll: false });
  }

  return (
    <section className="cor-bay" aria-label={`${dataset.name} records`}>
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">{dataset.name}</h2>
        <span className="cor-tag">{page.state === "ready" ? `${formatCount(page.total)} records${search ? " match" : ""}` : "No records"}</span>
      </div>
      <form role="search" className="cor-input-wrap cor-records__search" onSubmit={submit}>
        <Icon name="search" />
        <input key={`${dataset.id}:${search}`} className="cor-input" name="q" type="search" defaultValue={search} placeholder="Search records" aria-label={`Search ${dataset.name}`} />
      </form>
      {page.rows.length === 0 ? (
        <div className="cor-records__empty">
          <p className="cor-help" style={{ margin: 0 }}>{emptyMessage(page, dataset.name, sourceName, search)}</p>
          {search && page.state === "ready" && <Link className="cor-link" href={href({ search: "" })}>Clear search</Link>}
        </div>
      ) : (
        <>
          <div className="cor-table-wrap">
            <table className="cor-table">
              <thead><tr>{page.columns.map((column) => <th key={column.key} scope="col" className={column.format === "text" || column.format === "date" ? undefined : "n"}>{column.label}</th>)}</tr></thead>
              <tbody>
                {page.rows.map((row, i) => (
                  <tr key={`${page.page}-${i}`}>
                    {page.columns.map((column) => <td key={column.key} className={column.format === "text" || column.format === "date" ? undefined : "n"}>{formatCell(row[column.key], column.format, currency)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cor-pager">
            <span className="cor-tag">Rows {from}–{to} of {formatCount(page.total)}</span>
            <span className="cor-row" style={{ gap: "var(--space-2)" }}>
              {page.page > 1 ? <Link className="cor-key cor-key--sm cor-key--icon cor-flip" href={href({ page: page.page - 1 })} aria-label="Previous page"><Icon name="chevron-right" /></Link> : <span className="cor-key cor-key--sm cor-key--icon cor-flip" aria-hidden="true" data-disabled><Icon name="chevron-right" /></span>}
              {page.page < lastPage ? <Link className="cor-key cor-key--sm cor-key--icon" href={href({ page: page.page + 1 })} aria-label="Next page"><Icon name="chevron-right" /></Link> : <span className="cor-key cor-key--sm cor-key--icon" aria-hidden="true" data-disabled><Icon name="chevron-right" /></span>}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
