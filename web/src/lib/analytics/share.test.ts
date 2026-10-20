import { describe, expect, test } from "vitest";
import { roundShares, scopeTag } from "./share";

describe("roundShares", () => {
  test("rounds to whole percentages that always sum to 100", () => {
    expect(roundShares([0.444, 0.309, 0.179, 0.068])).toEqual([44, 31, 18, 7]);
    expect(roundShares([1 / 3, 1 / 3, 1 / 3]).reduce((a, b) => a + b, 0)).toBe(100);
  });

  test("returns zeros when nothing was spent", () => {
    expect(roundShares([0, 0])).toEqual([0, 0]);
  });
});

describe("scopeTag", () => {
  const channels = [
    { channelCode: "CH·01", included: true },
    { channelCode: "CH·02", included: true },
    { channelCode: "CH·03", included: false },
  ];

  test("says ALL when no channel is muted", () => {
    expect(scopeTag(channels.map((c) => ({ ...c, included: true })), null)).toBe("CH·ALL");
  });

  test("lists the included channel numbers", () => {
    expect(scopeTag(channels, null)).toBe("CH·01, 02");
  });

  test("names the campaign's channel when one campaign is selected", () => {
    expect(scopeTag(channels, "CH·02")).toBe("CH·02 · 1 campaign");
  });
});
