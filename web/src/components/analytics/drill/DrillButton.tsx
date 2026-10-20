"use client";

import type { ReactNode } from "react";
import type { DrillTarget } from "@/lib/analytics/drilldown";
import { useDrill } from "./context";

interface DrillButtonProps {
  target: DrillTarget;
  label: string;
  className?: string;
  children?: ReactNode;
}

/** Opens the drill-down drawer. Outside a provider it renders only its children. */
export function DrillButton({ target, label, className, children }: DrillButtonProps) {
  const drill = useDrill();
  if (!drill) return children ?? null;
  return (
    <button type="button" className={className} aria-label={label} onClick={() => drill.open(target)}>
      {children}
    </button>
  );
}
