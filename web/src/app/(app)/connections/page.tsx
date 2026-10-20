import type { Metadata } from "next";
import { Suspense } from "react";
import { ConnectionsBoard } from "@/components/connections/ConnectionsBoard";
import { ConnectionsSkeleton } from "@/components/connections/ConnectionsSkeleton";
import { parseNotice } from "@/components/connections/notice";
import { PageHeader } from "@/components/shell/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { dataSource } from "@/lib/data";
import { loadConnectionsPage } from "@/lib/data/snapshot";

export const metadata: Metadata = { title: "Connections" };

async function ConnectAction() {
  const user = await dataSource.getCurrentUser();
  if (user.role !== "admin") return null;
  return (
    <a className="cor-key cor-key--sm cor-key--primary" href="#available">
      <Icon name="plus" />Connect a platform
    </a>
  );
}

async function ConnectionsContent({ searchParams }: { searchParams: PageProps<"/connections">["searchParams"] }) {
  const [data, query] = await Promise.all([loadConnectionsPage(), searchParams]);
  return <ConnectionsBoard {...data} notice={parseNotice(query)} />;
}

export default function ConnectionsPage(props: PageProps<"/connections">) {
  return (
    <>
      <PageHeader title="Connections" actions={<Suspense fallback={null}><ConnectAction /></Suspense>} />
      <main className="cor-main">
        <Suspense fallback={<ConnectionsSkeleton />}>
          <ConnectionsContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
