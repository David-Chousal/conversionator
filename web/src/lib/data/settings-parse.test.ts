import { describe, expect, test } from "vitest";
import { parseAlertDraft, parseNotifications, parseProfile } from "./settings-parse";

describe("settings input parsing", () => {
  test("keeps known values and drops anything else", () => {
    expect(parseAlertDraft({ metric: "roas", platform: "pinterest", condition: "below", threshold: "2", delivery: "fax", scope: "root" }))
      .toEqual({ metric: "roas", platform: null, condition: "below", threshold: null, period: "day", delivery: null, slackChannel: "", scope: "personal" });
  });

  test("treats anything but true as off", () => {
    expect(parseNotifications({ alerts: { inApp: "yes", email: true } }).alerts).toEqual({ inApp: false, email: true });
  });

  test("survives garbage", () => {
    expect(parseProfile(null)).toEqual({ name: "", defaultRangeDays: Number.NaN });
  });
});
