import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Banner } from "@/components/feedback/Banner";
import { SignalMeter } from "@/components/status/SignalMeter";
import { loadSyncSnapshot } from "@/lib/data/snapshot";
import { TopBar } from "./TopBar";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

const MAX_PAGE_BANNERS = 2;

async function SyncStatus() {
  const { summary } = await loadSyncSnapshot();
  return <SignalMeter state={summary.state} lit={summary.lit} word={summary.word} />;
}

async function SyncBanners() {
  const { issues } = await loadSyncSnapshot();
  return issues.slice(0, MAX_PAGE_BANNERS).map(({ connection, signal }) => {
    const failed = signal.state === "failed";
    return (
      <Banner key={connection.id} tone={failed ? "failed" : "caution"} action={failed ? <Link className="cor-key cor-key--sm" href={`/oauth/${connection.platform}?mode=reconnect&connection=${connection.id}`}>Reconnect</Link> : undefined}>
        <strong>{connection.name} {failed ? "stopped syncing." : `is ${signal.age} behind.`}</strong>{" "}
        {failed ? (connection.failureReason ?? "Reconnect to resume.") : "Its numbers are from its last sync. COR keeps retrying every hour; nothing to do."}
      </Banner>
    );
  });
}

/** Top bar plus workspace-wide connection banners; sync health streams in after the title. */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <>
      <TopBar
        title={title}
        status={
          <Suspense fallback={<SignalMeter state="off" lit={0} word="Checking sync" />}>
            <SyncStatus />
          </Suspense>
        }
        actions={actions}
      />
      <Suspense fallback={null}>
        <SyncBanners />
      </Suspense>
    </>
  );
}
