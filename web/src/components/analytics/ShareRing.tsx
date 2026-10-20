import { roundShares } from "@/lib/analytics/share";
import type { ChannelSummary } from "@/lib/analytics/types";
import { formatMoney } from "@/lib/format";
import { channelColor } from "./color";

interface ShareRingProps {
  channels: ChannelSummary[];
  currency: string;
  rangeLabel: string;
}

interface Part {
  name: string;
  spend: number;
  color: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 40;
const GAP = 2;
const MAX_PARTS = 4;

function partsFor(channels: ChannelSummary[]): Part[] {
  const spending = channels.filter((channel) => channel.spend > 0).sort((a, b) => b.spend - a.spend);
  const parts = spending.map((channel) => ({ name: channel.name, spend: channel.spend, color: channelColor(channel.colorIndex) }));
  if (parts.length <= MAX_PARTS) return parts;
  const rest = parts.slice(MAX_PARTS - 1).reduce((sum, part) => sum + part.spend, 0);
  return [...parts.slice(0, MAX_PARTS - 1), { name: "Other", spend: rest, color: "var(--ch-other)" }];
}

/** Share of spend for up to four parts, with the total in the middle and an exact key. */
export function ShareRing({ channels, currency, rangeLabel }: ShareRingProps) {
  const parts = partsFor(channels);
  const total = parts.reduce((sum, part) => sum + part.spend, 0);
  const percents = roundShares(parts.map((part) => part.spend));
  const summary = parts.map((part, i) => `${part.name} ${percents[i]}%`).join(", ");
  const lengths = parts.map((part) => (part.spend / total) * CIRCUMFERENCE);
  const offsets = lengths.map((_, i) => lengths.slice(0, i).reduce((sum, length) => sum + length, 0));

  return (
    <section className="cor-bay" aria-label="Share of spend">
      <div className="cor-bay__head">
        <h2 className="cor-bay__title">Share of spend</h2>
        <span className="cor-tag">{rangeLabel} · all channels</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-8)", alignItems: "center" }}>
        <svg className="cor-ring" viewBox="0 0 120 120" role="img" aria-label={`Share of spend: ${summary}.`}>
          <g transform="rotate(-90 60 60)" fill="none" strokeWidth="12">
            {parts.map((part, i) => (
              <circle key={part.name} cx="60" cy="60" r="40" style={{ stroke: part.color }} strokeDasharray={`${Math.max(0, lengths[i] - GAP)} ${CIRCUMFERENCE}`} strokeDashoffset={-offsets[i]} />
            ))}
          </g>
          <text className="cor-ring__center" x="60" y="61" textAnchor="middle">{formatMoney(total, { currency, compact: true })}</text>
          <text className="cor-ring__sub" x="60" y="72" textAnchor="middle">TOTAL SPEND</text>
        </svg>
        <div className="cor-keylist" style={{ flex: 1, minWidth: 220 }}>
          {parts.map((part, i) => (
            <div key={part.name}>
              <i style={{ background: part.color }} />{part.name}
              <span className="cor-num">{formatMoney(part.spend, { currency, compact: true })}</span>
              <span className="cor-num" style={{ color: "var(--ink)" }}>{percents[i]}%</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
