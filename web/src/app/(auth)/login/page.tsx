import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { dataSource } from "@/lib/data";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  const workspace = await dataSource.getWorkspace();
  return (
    <div className="cor-login">
      <div className="cor-login__art">
        <span className="cor-wordmark" style={{ fontSize: 28 }}>COR</span>
        <div style={{ display: "grid", gap: "var(--space-4)", maxWidth: 460, position: "relative", zIndex: 1 }}>
          <h1 style={{ margin: 0, font: "700 48px/48px var(--font-sans)", letterSpacing: "-.035em" }}>Every channel.<br />One board.</h1>
          <p className="cor-tag" style={{ margin: 0, color: "var(--bg)", opacity: 0.8 }}>Google Ads · Meta Ads · LinkedIn Ads · attributed with HubSpot</p>
        </div>
        <svg viewBox="0 0 240 200" width="240" height="200" aria-hidden="true" style={{ position: "absolute", right: 0, bottom: 0 }}>
          <rect x="0" y="140" width="40" height="60" style={{ fill: "var(--cobalt-soft)" }} />
          <rect x="56" y="96" width="40" height="104" style={{ fill: "var(--ch-2)" }} />
          <rect x="112" y="40" width="48" height="160" style={{ fill: "var(--cobalt)" }} />
          <rect x="176" y="0" width="64" height="200" style={{ fill: "var(--flare)" }} />
        </svg>
      </div>
      <LoginForm workspaceName={workspace.name} />
    </div>
  );
}
