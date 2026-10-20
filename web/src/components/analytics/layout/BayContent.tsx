import Link from "next/link";
import type { BoardContext } from "@/lib/analytics/board-context";
import type { BayConfig } from "@/lib/analytics/layout";
import { metricLabel } from "@/lib/analytics/metrics";
import type { AnalyticsReport, MetricKey } from "@/lib/analytics/types";
import { CampaignTable } from "../CampaignTable";
import { Readout } from "../Readout";
import { ReturnLedger } from "../ReturnLedger";
import { ShareRing } from "../ShareRing";
import { TracePanel } from "../TracePanel";
import { CRM_ONLY_METRICS } from "./bay-names";

interface BayContentProps {
  bay: BayConfig;
  report: AnalyticsReport;
  context: BoardContext;
}

function CrmOnlyReadout({ metric, scope }: { metric: MetricKey; scope: string }) {
  const label = metricLabel(metric, "crm");
  return (
    <section className="cor-bay" aria-label={label}>
      <div className="cor-bay__head cor-readout__head">
        <span className="cor-readout__name"><span className="cor-tag">{label}</span><span className="cor-badge cor-badge--muted">CRM only</span></span>
        <span className="cor-tag">{scope}</span>
      </div>
      <p className="cor-help" style={{ margin: 0 }}>
        {metric === "leads" ? "Leads come from your CRM." : "Cost per lead needs leads from your CRM."} Ad platforms don&apos;t report them.
      </p>
      <Link className="cor-link" href="/settings?tab=crm">Connect HubSpot</Link>
    </section>
  );
}

/** The bay a layout entry stands for, rendered from the report. */
export function BayContent({ bay, report, context }: BayContentProps) {
  const { currency, attribution } = report;
  if (bay.kind === "readout" && bay.metric) {
    if (CRM_ONLY_METRICS.includes(bay.metric) && attribution.source !== "crm") return <CrmOnlyReadout metric={bay.metric} scope={context.scope} />;
    return <Readout data={report.readoutsByKey[bay.metric]} currency={currency} windowDays={context.windowDays} scope={context.scope} drill />;
  }
  if (bay.kind === "trace") return <TracePanel trace={report.trace} currency={currency} rangeLabel={context.rangeLabel} />;
  if (bay.kind === "ledger") return <ReturnLedger rows={report.ledger} currency={currency} rangeLabel={context.rangeLabel} revenueLabel={context.revenueLabel} drill />;
  if (bay.kind === "share") return <ShareRing channels={report.channels} currency={currency} rangeLabel={context.rangeLabel} />;
  return <CampaignTable rows={report.campaigns} totals={report.campaignTotals} currency={currency} source={attribution.source} />;
}
