"use client";

import { Icon } from "@/components/ui/Icon";
import { BAY_KINDS, isOnBoard, type BayConfig, type BayKind } from "@/lib/analytics/layout";
import type { AttributionSource, MetricKey } from "@/lib/analytics/types";
import { BayGlyph } from "./BayGlyph";
import { bayName } from "./bay-names";

interface BayLibraryProps {
  bays: BayConfig[];
  source: AttributionSource;
  onAdd: (kind: BayKind, metric?: MetricKey) => void;
}

const READOUT_METRICS: Record<AttributionSource, MetricKey[]> = {
  crm: ["spend", "leads", "cpl", "conversions", "cpa", "roas"],
  platform: ["spend", "conversions", "cpa", "roas"],
};
const OTHER_KINDS: BayKind[] = ["trace", "ledger", "share", "campaigns"];

/** Every bay the board can show, with its widths and an Add key. */
export function BayLibrary({ bays, source, onAdd }: BayLibraryProps) {
  const items = [
    ...READOUT_METRICS[source].map((metric) => ({ kind: "readout" as BayKind, metric })),
    ...OTHER_KINDS.map((kind) => ({ kind, metric: undefined })),
  ];
  return (
    <aside className="cor-lib-rail" aria-label="Add a bay">
      <span className="cor-tag">Add a bay</span>
      <div className="cor-lib">
        {items.map(({ kind, metric }) => {
          const info = BAY_KINDS[kind];
          const name = bayName({ kind, metric }, source);
          const onBoard = isOnBoard(bays, kind, metric);
          return (
            <div key={`${kind}:${metric ?? ""}`} className="cor-lib__item">
              <BayGlyph kind={kind} />
              <span className="cor-list__main">
                <strong>{name}</strong>
                <span>{info.description} · {info.spans.join(", ")} cols</span>
              </span>
              <button type="button" className="cor-key cor-key--sm cor-key--icon" aria-label={`Add ${name}`} disabled={onBoard} title={onBoard ? "Already on the board" : undefined} onClick={() => onAdd(kind, metric)}>
                <Icon name="plus" />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
