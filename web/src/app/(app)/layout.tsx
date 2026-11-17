import { Toaster } from "@/components/feedback/Toaster";
import { Sidebar } from "@/components/shell/Sidebar";
import { TOKEN_COOKIE_NAME, backendClient } from "@/lib/data/backend-connection";
import { dataSource } from "@/lib/data";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Against the real backend, everything behind the shell needs a session; mock mode has none.
  if (backendClient() && !(await cookies()).get(TOKEN_COOKIE_NAME)) {
    redirect("/login");
  }
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
