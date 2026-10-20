import Link from "next/link";
import type { CSSProperties } from "react";
import { Banner } from "@/components/feedback/Banner";
import type { Attribution } from "@/lib/analytics/types";
import type { LeadStage } from "@/lib/data/types";
import { formatCount } from "@/lib/format";

const STAGE_NAMES: Record<LeadStage, string> = { lead: "lead", mql: "marketing qualified lead", sql: "sales qualified lead" };

function PlatformReported({ attribution }: { attribution: Attribution }) {
  if (attribution.crmStatus === "syncing") {
    return (
      <Banner tone="info" icon="sync">
        <strong>HubSpot is on its first sync.</strong> Conversions and revenue below are platform-reported until it finishes, then switch to HubSpot&apos;s attribution.
      </Banner>
    );
  }
  return (
    <Banner tone="info" icon="info" action={<Link className="cor-key cor-key--sm" href="/settings?tab=crm">Connect HubSpot</Link>}>
      <strong>Conversions and revenue are platform-reported.</strong> Each ad platform counts its own, so totals can overlap. Connect your CRM to attribute leads and deals to the ad that drove them.
    </Banner>
  );
}

/** How the board's outcomes were attributed, and how much of the CRM they cover. */
export function AttributionBay({ attribution }: { attribution: Attribution }) {
  if (attribution.source !== "crm") return <PlatformReported attribution={attribution} />;
  const { attributed, unattributed, crmName } = attribution;
  const totalLeads = attributed.leads + unattributed.leads;
  const coverage = totalLeads > 0 ? attributed.leads / totalLeads : 0;
  const percent = Math.round(coverage * 100);

  return (
    <section className="cor-bay" aria-label="Attribution">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">Attribution</h2>
        <span className="cor-tag">
          {crmName} · Last ad interaction · leads counted at {STAGE_NAMES[attribution.leadStage ?? "lead"]}
        </span>
      </div>
      {attribution.crmStatus === "failed" && (
        <Banner tone="failed"><strong>{crmName} stopped syncing.</strong> Leads and deals cover up to its last sync. Reconnect it in Settings.</Banner>
      )}
      <div className="cor-strip" role="img" aria-label={`${percent}% of ${crmName} leads attributed to ads`}>
        <i style={{ flex: attributed.leads, background: "var(--cobalt)" } as CSSProperties} />
        <i className="muted" style={{ flex: unattributed.leads } as CSSProperties} />
      </div>
      <div className="cor-row" style={{ justifyContent: "space-between" }}>
        <p className="cor-help" style={{ margin: 0 }}>
          {crmName} matched {formatCount(attributed.leads)} of {formatCount(totalLeads)} leads ({percent}%) to an ad. The other {formatCount(unattributed.leads)} came from organic search, email or direct visits and aren&apos;t in these numbers.
        </p>
        <Link className="cor-link" href="/settings?tab=crm">Attribution settings →</Link>
      </div>
    </section>
  );
}
