import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComposerContent, ComposerSkeleton } from "../composer-page";

export const metadata: Metadata = { title: "Report" };

async function ReportContent({ params }: { params: PageProps<"/reports/[id]">["params"] }) {
  const { id } = await params;
  return <ComposerContent reportId={id} />;
}

export default function ReportPage(props: PageProps<"/reports/[id]">) {
  return (
    <>
      <PageHeader title="Report" />
      <main className="cor-main">
        <Suspense fallback={<ComposerSkeleton />}>
          <ReportContent params={props.params} />
        </Suspense>
      </main>
    </>
  );
}
