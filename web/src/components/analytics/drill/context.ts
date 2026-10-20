"use client";

import { createContext, useContext } from "react";
import type { DrillTarget } from "@/lib/analytics/drilldown";

export const DrillContext = createContext<{ open: (target: DrillTarget) => void } | null>(null);

/** Null outside a DrillProvider, so components can render without drill-down. */
export function useDrill() {
  return useContext(DrillContext);
}
