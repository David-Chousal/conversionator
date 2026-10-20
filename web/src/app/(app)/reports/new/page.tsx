import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { ComposerContent, ComposerSkeleton } from "../composer-page";

export const metadata: Metadata = { title: "New report" };

export default function NewReportPage() {
  return (
    <>
      <PageHeader title="New report" />
      <main className="cor-main">
        <Suspense fallback={<ComposerSkeleton />}>
          <ComposerContent reportId={null} />
        </Suspense>
      </main>
    </>
  );
}
