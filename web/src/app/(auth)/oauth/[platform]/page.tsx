import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { approveAuthorization, cancelAuthorization } from "@/app/(app)/connections/actions";
import { approveCrmAuthorization, cancelCrmAuthorization } from "@/app/(app)/settings/actions";
import { PlatformMark } from "@/components/connections/PlatformMark";
import { Banner } from "@/components/feedback/Banner";
import { PLATFORMS } from "@/lib/data/catalog";

export const metadata: Metadata = { title: "Allow access" };

type Props = PageProps<"/oauth/[platform]">;

// HubSpot is a CRM, connected from Settings; it shares this mock sign-in step with the ad platforms.
const HUBSPOT = { platform: "hubspot", name: "HubSpot", monogram: "H", provides: "Contacts, lifecycle stages, deals and the ad each contact came from" };

async function Consent({ params, searchParams }: Props) {
  const [{ platform }, query] = await Promise.all([params, searchParams]);
  const crm = platform === "hubspot";
  const info = crm ? HUBSPOT : PLATFORMS.find((entry) => entry.platform === platform);
  if (!info) notFound();
  const reconnecting = query.mode === "reconnect" && (crm || typeof query.connection === "string");

  return (
    <div className="cor-oauth__card">
      <span className="cor-tag">Mock sign-in · stands in for the {info.name} page</span>
      <div className="cor-row" style={{ gap: "var(--space-3)" }}>
        <PlatformMark monogram={info.monogram} />
        <span className="cor-tag">→</span>
        <span className="cor-wordmark" style={{ padding: 0 }}>COR</span>
      </div>
      <h1 className="cor-oauth__title">{reconnecting ? `Renew COR's access to ${info.name}?` : `Allow COR to read your ${info.name} data?`}</h1>
      <p style={{ margin: 0 }}>
        COR will be able to read {info.provides.toLowerCase()}. It can&apos;t change your {crm ? "CRM records" : "campaigns"}, and it never sees your {info.name} password.
      </p>
      <Banner tone="info" icon="info">
        In production this step happens on the {info.name} sign-in page. Here, Allow simulates approving access and Cancel simulates backing out.
      </Banner>
      <form className="cor-row" style={{ gap: "var(--space-2)", justifyContent: "flex-end" }}>
        <input type="hidden" name="platform" value={info.platform} />
        <input type="hidden" name="mode" value={reconnecting ? "reconnect" : "connect"} />
        {reconnecting && !crm && <input type="hidden" name="connection" value={String(query.connection)} />}
        <button className="cor-key" formAction={crm ? cancelCrmAuthorization : cancelAuthorization}>Cancel</button>
        <button className="cor-key cor-key--primary" formAction={crm ? approveCrmAuthorization : approveAuthorization}>Allow access <kbd>⏎</kbd></button>
      </form>
    </div>
  );
}

export default function OAuthPage(props: Props) {
  return (
    <main className="cor-oauth">
      <Suspense fallback={<div className="cor-oauth__card"><span className="cor-skel" /></div>}>
        <Consent {...props} />
      </Suspense>
    </main>
  );
}
