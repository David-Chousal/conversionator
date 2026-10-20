import type { Metadata } from "next";
import { Suspense } from "react";
import { CrmNotice } from "@/components/settings/CrmNotice";
import { parseCrmNotice } from "@/components/settings/crm-notice";
import { AlertsPanel } from "@/components/settings/AlertsPanel";
import { CrmPanel } from "@/components/settings/CrmPanel";
import { GeneralForm } from "@/components/settings/GeneralForm";
import { NotificationsForm } from "@/components/settings/NotificationsForm";
import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { WorkspaceForm } from "@/components/settings/WorkspaceForm";
import { PageHeader } from "@/components/shell/PageHeader";
import { loadSettingsPage, type SettingsPageData } from "@/lib/data/settings-loader";

export const metadata: Metadata = { title: "Settings" };

type Query = Awaited<PageProps<"/settings">["searchParams"]>;

function TabContent({ data, query }: { data: SettingsPageData; query: Query }) {
  switch (data.tab) {
    case "alerts":
      return <AlertsPanel alerts={data.alerts} feed={data.feed} series={data.series} canManage={data.canManage} />;
    case "notifications":
      return <NotificationsForm prefs={data.notifications} channels={data.notificationChannels} weekStart={data.workspace.weekStart} canManage={data.canManage} />;
    case "workspace":
      return <WorkspaceForm key={JSON.stringify(data.workspace)} workspace={data.workspace} canManage={data.canManage} />;
    case "crm":
      return (
        <>
          <CrmNotice notice={parseCrmNotice(query)} />
          <CrmPanel crm={data.crm} signal={data.crmSignal} timing={data.crmTiming} canManage={data.canManage} />
        </>
      );
    default:
      return <GeneralForm user={data.user} defaultRangeDays={data.preferences.defaultRangeDays} workspace={data.workspace} canManage={data.canManage} />;
  }
}

async function SettingsContent({ searchParams }: { searchParams: PageProps<"/settings">["searchParams"] }) {
  const query = await searchParams;
  const data = await loadSettingsPage(query);
  return (
    <>
      <SettingsTabs active={data.tab} />
      <TabContent data={data} query={query} />
    </>
  );
}

function SettingsSkeleton() {
  return (
    <section className="cor-bay" aria-busy="true" aria-label="Loading settings">
      <div className="cor-bay__head"><span className="cor-bay__title">Settings</span><span className="cor-tag">Loading…</span></div>
      <span className="cor-skel" style={{ height: 200 }} />
    </section>
  );
}

export default function SettingsPage(props: PageProps<"/settings">) {
  return (
    <>
      <PageHeader title="Settings" />
      <main className="cor-main">
        <Suspense fallback={<SettingsSkeleton />}>
          <SettingsContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </>
  );
}
