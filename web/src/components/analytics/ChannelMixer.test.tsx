import { beforeEach, describe, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ChannelMixer } from "./ChannelMixer";
import { addDays } from "@/lib/analytics/dates";
import type { ChannelSummary } from "@/lib/analytics/types";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const TODAY = "2026-03-30";
const ok = { state: "ok" as const, lit: 4, word: "Synced" };
const channel = (platform: ChannelSummary["platform"], name: string, code: string, share: number): ChannelSummary => ({
  platform, name, channelCode: code, signal: ok, dataThrough: TODAY, colorIndex: Number(code.slice(-1)), included: true, spend: share * 1000, share,
});

function renderMixer(overrides: Partial<Parameters<typeof ChannelMixer>[0]> = {}) {
  render(
    <ChannelMixer
      filter={{ from: "2026-03-01", to: TODAY, excluded: [], campaignId: null }}
      today={TODAY}
      channels={[channel("google-ads", "Google Ads", "CH·01", 0.6), channel("meta-ads", "Meta Ads", "CH·02", 0.4)]}
      campaignOptions={[{ id: "google-brand", name: "Brand search", platform: "google-ads" }]}
      dailySpend={Array.from({ length: 180 }, (_, i) => ({ date: addDays(TODAY, i - 179), spend: 100 }))}
      {...overrides}
    />,
  );
}

describe("ChannelMixer", () => {
  beforeEach(() => replace.mockClear());

  test("states the window in words", () => {
    renderMixer();
    expect(screen.getByText("Window · Mar 1 → Mar 30 · 30 days")).toBeDefined();
  });

  test("mutes a channel by writing it to the URL", () => {
    renderMixer();
    fireEvent.click(screen.getByRole("button", { name: /Meta Ads/ }));
    expect(replace).toHaveBeenCalledWith("/analytics?off=meta-ads", { scroll: false });
  });

  test("won't mute the last channel left on", () => {
    renderMixer({
      filter: { from: "2026-03-01", to: TODAY, excluded: ["meta-ads"], campaignId: null },
      channels: [channel("google-ads", "Google Ads", "CH·01", 0.6), { ...channel("meta-ads", "Meta Ads", "CH·02", 0.4), included: false }],
    });
    expect(screen.getByRole("button", { name: /Google Ads/ }).hasAttribute("disabled")).toBe(true);
  });

  test("applies a preset window", () => {
    renderMixer();
    fireEvent.click(screen.getByRole("button", { name: "7d" }));
    expect(replace).toHaveBeenCalledWith("/analytics?from=2026-03-24&to=2026-03-30", { scroll: false });
  });

  test("narrows to a campaign", () => {
    renderMixer();
    fireEvent.change(screen.getByLabelText("Campaign"), { target: { value: "google-brand" } });
    expect(replace).toHaveBeenCalledWith("/analytics?campaign=google-brand", { scroll: false });
  });

  test("commits the latest window even when key up arrives before a re-render", () => {
    renderMixer();
    const start = screen.getByRole("slider", { name: "Window start" });
    act(() => {
      start.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", shiftKey: true, bubbles: true }));
      start.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowLeft", shiftKey: true, bubbles: true }));
    });
    expect(replace).toHaveBeenCalledWith("/analytics?from=2026-02-22&to=2026-03-30", { scroll: false });
  });

  test("moves the window end one day earlier with the arrow key", () => {
    renderMixer();
    const end = screen.getByRole("slider", { name: "Window end" });
    fireEvent.keyDown(end, { key: "ArrowLeft" });
    fireEvent.keyUp(end, { key: "ArrowLeft" });
    expect(replace).toHaveBeenCalledWith("/analytics?from=2026-03-01&to=2026-03-29", { scroll: false });
  });
});
