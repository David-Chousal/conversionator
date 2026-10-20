import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ReportComposer } from "@/components/reports/ReportComposer";
import { Icon } from "@/components/ui/Icon";
import { loadComposer } from "@/lib/reports/loader";

/** Shared by /reports/new and /reports/[id]. */
export async function ComposerContent({ reportId }: { reportId: string | null }) {
  const data = await loadComposer(reportId);
  if (!data) notFound();
  if (data.channels.length === 0) {
    return (
      <EmptyState status="No signal · 0 sources" title="Nothing to report on yet."
        action={<Link className="cor-key cor-key--primary" href="/connections"><Icon name="connections" />Connect a platform</Link>}>
        Connect an ad platform first; reports combine its data with your other channels.
      </EmptyState>
    );
  }
  return <ReportComposer {...data} />;
}

export function ComposerSkeleton() {
  return (
    <section className="cor-bay" aria-busy="true" aria-label="Loading the report">
      <div className="cor-bay__head"><span className="cor-bay__title">Report</span><span className="cor-tag">Loading…</span></div>
      <span className="cor-skel" style={{ height: 320 }} />
    </section>
  );
}
