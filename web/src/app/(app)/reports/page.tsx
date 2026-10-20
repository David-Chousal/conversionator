import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ReportList } from "@/components/reports/ReportList";
import { PageHeader } from "@/components/shell/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { loadReportsPage } from "@/lib/reports/loader";

export const metadata: Metadata = { title: "Reports" };

const newReport = <Link className="cor-key cor-key--sm cor-key--primary" href="/reports/new"><Icon name="plus" />New report</Link>;

async function ReportsContent() {
  const { rows, hasChannels } = await loadReportsPage();
  if (!hasChannels) {
    return (
      <EmptyState status="No signal · 0 sources" title="Nothing to report on yet."
        action={<Link className="cor-key cor-key--primary" href="/connections"><Icon name="connections" />Connect a platform</Link>}>
        Reports combine data from your ad platforms. Connect one and its numbers can go into a PDF or CSV.
      </EmptyState>
    );
  }
  if (rows.length === 0) {
    return <EmptyState status="0 reports" title="No reports yet." action={newReport}>Combine metrics from every channel into one PDF or CSV, now or on a weekly or monthly schedule.</EmptyState>;
  }
  return (
    <section className="cor-bay" aria-labelledby="reports-title">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title" id="reports-title">Reports</h2>
        <span className="cor-tag">{rows.length} saved · {rows.filter((row) => row.schedule).length} scheduled</span>
      </div>
      <ReportList rows={rows} />
    </section>
  );
}

function ReportsSkeleton() {
  return (
    <section className="cor-bay" aria-busy="true" aria-label="Loading reports">
      <div className="cor-bay__head"><span className="cor-bay__title">Reports</span><span className="cor-tag">Loading…</span></div>
      <span className="cor-skel" style={{ height: 200 }} />
    </section>
  );
}

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" actions={newReport} />
      <main className="cor-main">
        <Suspense fallback={<ReportsSkeleton />}>
          <ReportsContent />
        </Suspense>
      </main>
    </>
  );
}
