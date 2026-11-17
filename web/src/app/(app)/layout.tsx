import { Toaster } from "@/components/feedback/Toaster";
import { Sidebar } from "@/components/shell/Sidebar";
import { TOKEN_COOKIE_NAME, backendClient } from "@/lib/data/backend-connection";
import { dataSource } from "@/lib/data";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Against the real backend, everything behind the shell needs a valid session;
  // mock mode has none. Tokens are in-memory and die with each backend restart,
  // so a cookie can be present but stale — check it with /me before rendering.
  if (backendClient()) {
    if (!(await cookies()).get(TOKEN_COOKIE_NAME)) redirect("/login");
    try {
      await dataSource.getCurrentUser();
    } catch {
      redirect("/login"); // stale or revoked token: a fresh sign-in replaces the cookie
    }
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
