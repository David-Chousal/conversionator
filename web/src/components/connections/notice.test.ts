import { describe, expect, test } from "vitest";
import { parseNotice } from "./notice";

describe("parseNotice", () => {
  test("reads a successful connection", () => {
    expect(parseNotice({ connected: "tiktok-ads" })).toEqual({ kind: "connected", platformName: "TikTok Ads" });
  });

  test("reads a cancelled sign-in", () => {
    expect(parseNotice({ cancelled: "google-ads" })).toEqual({ kind: "cancelled", platformName: "Google Ads" });
  });

  test("reads a failure with its reason", () => {
    expect(parseNotice({ failed: "google-ads", reason: "Google Ads is already connected." })).toEqual({ kind: "failed", platformName: "Google Ads", reason: "Google Ads is already connected." });
  });

  test("ignores unknown platforms and empty queries", () => {
    expect(parseNotice({ connected: "myspace" })).toBeUndefined();
    expect(parseNotice({})).toBeUndefined();
  });
});
