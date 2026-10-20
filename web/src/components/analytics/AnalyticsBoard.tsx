import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatRange } from "@/lib/analytics/dates";
import { analyticsHref, presetWindow } from "@/lib/analytics/filter";
import type { SavedView } from "@/lib/analytics/layout";
import type { AnalyticsReport } from "@/lib/analytics/types";
import { AttributionBay } from "./AttributionBay";
import { ChannelMixer } from "./ChannelMixer";
import { DrillProvider } from "./drill/DrillProvider";
import { LayoutBoard } from "./layout/LayoutBoard";

interface AnalyticsBoardProps {
  report: AnalyticsReport;
  views: SavedView[];
  activeViewId: string;
}

const WIDEST_PRESET_DAYS = 90;

/** The Analytics board: mixer and attribution first (they scope everything), then the saved view's bays. */
export function AnalyticsBoard({ report, views, activeViewId }: AnalyticsBoardProps) {
  const { filter, today } = report;
  const rangeLabel = formatRange(filter.from, filter.to, today);
  const widened = analyticsHref({ ...filter, ...presetWindow(WIDEST_PRESET_DAYS, today) }, today, activeViewId);

  return (
    <>
      <ChannelMixer filter={filter} today={today} viewId={activeViewId} channels={report.channels} campaignOptions={report.campaignOptions} dailySpend={report.dailySpend} />
      {report.hasData ? (
        <DrillProvider report={report} viewId={activeViewId}>
          <AttributionBay attribution={report.attribution} />
          <LayoutBoard report={report} views={views} activeViewId={activeViewId} />
        </DrillProvider>
      ) : (
        <EmptyState
          status={`No data · ${rangeLabel}`}
          title={`No data for ${rangeLabel}.`}
          action={<Link className="cor-key cor-key--primary" href={widened} replace scroll={false}>Widen the window to 90 days</Link>}
        >
          None of the selected channels or campaigns recorded spend or conversions in this window. Widen the window or turn more channels on.
        </EmptyState>
      )}
    </>
  );
}
