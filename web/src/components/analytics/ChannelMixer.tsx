"use client";

import { useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { dayCount, formatDay, formatRange, type IsoDate } from "@/lib/analytics/dates";
import { PRESET_DAYS, activePreset, analyticsHref, presetWindow } from "@/lib/analytics/filter";
import { DEFAULT_VIEW_ID } from "@/lib/analytics/layout";
import { roundShares } from "@/lib/analytics/share";
import type { DateWindow } from "@/lib/analytics/scrub";
import type { AnalyticsFilter, AnalyticsReport, ChannelSummary } from "@/lib/analytics/types";
import { channelColor } from "./color";
import { Scrubber } from "./Scrubber";

interface ChannelMixerProps {
  filter: AnalyticsFilter;
  today: IsoDate;
  /** The saved view to keep in links. */
  viewId?: string;
  channels: ChannelSummary[];
  campaignOptions: AnalyticsReport["campaignOptions"];
  dailySpend: AnalyticsReport["dailySpend"];
}

/** The page's filter: date window, channel toggles and campaign, written to the URL. */
export function ChannelMixer({ filter, today, viewId = DEFAULT_VIEW_ID, channels, campaignOptions, dailySpend }: ChannelMixerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const days = dayCount(filter.from, filter.to);
  const preset = activePreset(filter, today);
  const percents = roundShares(channels.map((channel) => channel.share));
  const includedCount = channels.filter((channel) => channel.included).length;

  function navigate(next: AnalyticsFilter) {
    startTransition(() => router.replace(analyticsHref(next, today, viewId), { scroll: false }));
  }

  function toggle(channel: ChannelSummary) {
    const excluded = channel.included ? [...filter.excluded, channel.platform] : filter.excluded.filter((platform) => platform !== channel.platform);
    const campaign = campaignOptions.find((option) => option.id === filter.campaignId);
    navigate({ ...filter, excluded, campaignId: campaign && excluded.includes(campaign.platform) ? null : filter.campaignId });
  }

  const setWindow = (window: DateWindow) => navigate({ ...filter, ...window });

  return (
    <section className="cor-bay" aria-label="Dashboard filters" aria-busy={pending}>
      <div className="cor-bay__head">
        <span className="cor-tag">Window · {formatRange(filter.from, filter.to, today)} · {days} {days === 1 ? "day" : "days"}</span>
        <span className="cor-row" style={{ gap: "var(--space-3)" }}>
          <span className="cor-seg" role="group" aria-label="Preset windows">
            {PRESET_DAYS.map((presetDays) => (
              <button key={presetDays} type="button" aria-pressed={preset === presetDays} onClick={() => setWindow(presetWindow(presetDays, today))}>{presetDays}d</button>
            ))}
          </span>
          <span className="cor-tag" aria-hidden="true">Campaign</span>
          <select className="cor-input cor-mixer__campaign" aria-label="Campaign" value={filter.campaignId ?? ""} onChange={(event) => navigate({ ...filter, campaignId: event.target.value || null })}>
            <option value="">All campaigns</option>
            {channels.filter((channel) => channel.included).map((channel) => (
              <optgroup key={channel.platform} label={`${channel.channelCode} ${channel.name}`}>
                {campaignOptions.filter((option) => option.platform === channel.platform).map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </optgroup>
            ))}
          </select>
        </span>
      </div>
      <div>
        <Scrubber key={`${filter.from}:${filter.to}`} days={dailySpend} window={{ from: filter.from, to: filter.to }} onCommit={setWindow} />
        <div className="cor-row cor-tag" style={{ justifyContent: "space-between" }}>
          <span>{formatDay(dailySpend[0].date)}</span>
          <span>{formatDay(dailySpend[dailySpend.length - 1].date)}</span>
        </div>
      </div>
      <div style={{ display: "grid", gap: "var(--space-3)" }}>
        <div className="cor-strip" aria-hidden="true">
          {channels.filter((channel) => channel.share > 0).map((channel) => (
            <i key={channel.platform} className={channel.included ? undefined : "muted"} style={{ flex: channel.share, background: channelColor(channel.colorIndex) } as CSSProperties} />
          ))}
        </div>
        <div className="cor-toggles">
          {channels.map((channel, i) => (
            <button
              key={channel.platform}
              type="button"
              className="cor-toggle"
              aria-pressed={channel.included}
              disabled={channel.included && includedCount === 1}
              title={channel.included && includedCount === 1 ? "At least one channel stays on" : undefined}
              onClick={() => toggle(channel)}
            >
              <span className="box" style={{ background: channelColor(channel.colorIndex) }} />
              <span className="cor-tag">{channel.channelCode}</span>{channel.name} <span className="cor-num">{percents[i]}%</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
