import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { TeamBoard } from "@/components/team/TeamBoard";
import { loadTeamPage } from "@/lib/data/team-loader";

export const metadata: Metadata = { title: "Team" };

async function TeamContent() {
  const team = await loadTeamPage();
  return <TeamBoard {...team} />;
}

function TeamSkeleton() {
  return (
    <section className="cor-bay" aria-busy="true" aria-label="Loading the team">
      <div className="cor-bay__head"><span className="cor-bay__title">Members</span><span className="cor-tag">Checking…</span></div>
      <span className="cor-skel" style={{ height: 240 }} />
    </section>
  );
}

export default function TeamPage() {
  return (
    <>
      <PageHeader title="Team" />
      <main className="cor-main">
        <Suspense fallback={<TeamSkeleton />}>
          <TeamContent />
        </Suspense>
      </main>
    </>
  );
}
