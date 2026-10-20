"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import type { DrillTarget } from "@/lib/analytics/drilldown";
import { DEFAULT_VIEW_ID } from "@/lib/analytics/layout";
import type { AnalyticsReport } from "@/lib/analytics/types";
import { DrillContext } from "./context";
import { DrillDrawer } from "./DrillDrawer";

interface DrillProviderProps {
  report: AnalyticsReport;
  /** The saved view to keep when the drawer filters the board. */
  viewId?: string;
  children: ReactNode;
}

/** Lets readouts, ledger rows and chart points open the drill-down drawer for this report. */
export function DrillProvider({ report, viewId = DEFAULT_VIEW_ID, children }: DrillProviderProps) {
  const [target, setTarget] = useState<DrillTarget | null>(null);
  const trigger = useRef<HTMLElement | null>(null);

  const open = useCallback((next: DrillTarget) => {
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setTarget(next);
  }, []);

  const close = useCallback(() => {
    setTarget(null);
    trigger.current?.focus();
  }, []);

  const value = useMemo(() => ({ open }), [open]);
  return (
    <DrillContext value={value}>
      {children}
      {target && <DrillDrawer report={report} viewId={viewId} target={target} onNavigate={setTarget} onClose={close} />}
    </DrillContext>
  );
}
