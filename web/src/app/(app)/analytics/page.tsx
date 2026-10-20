import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnalyticsBoard } from "@/components/analytics/AnalyticsBoard";
import { AnalyticsSkeleton } from "@/components/analytics/AnalyticsSkeleton";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PageHeader } from "@/components/shell/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { loadAnalyticsPage } from "@/lib/analytics/loader";

export const metadata: Metadata = { title: "Analytics" };

async function AnalyticsContent({ searchParams }: { searchParams: PageProps<"/analytics">["searchParams"] }) {
  const data = await loadAnalyticsPage(await searchParams);
  if (data.state === "no-channels") {
    return (
      <EmptyState
        status="No signal · 0 channels"
        title="Nothing is patched in yet."
        action={<Link className="cor-key cor-key--primary" href="/connections"><Icon name="connections" />Connect a platform <kbd>G C</kbd></Link>}
      >
        Connect your first ad platform and COR will pull the last 90 days of spend, clicks and conversions.
      </EmptyState>
    );
  }
  return <AnalyticsBoard report={data.report} views={data.views} activeViewId={data.activeViewId} />;
}

export default function AnalyticsPage(props: PageProps<"/analytics">) {
  return (
    <>
      <PageHeader title="Analytics" />
      <main className="cor-main">
        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
