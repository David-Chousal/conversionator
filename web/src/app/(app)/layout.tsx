import { Toaster } from "@/components/feedback/Toaster";
import { Sidebar } from "@/components/shell/Sidebar";
import { dataSource } from "@/lib/data";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [workspace, user] = await Promise.all([dataSource.getWorkspace(), dataSource.getCurrentUser()]);
  return (
    <Toaster>
      <div className="cor-shell">
        <Sidebar workspaceName={workspace.name} user={user} />
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </Toaster>
  );
}
