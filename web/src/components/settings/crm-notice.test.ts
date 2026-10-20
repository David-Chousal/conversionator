import { describe, expect, test } from "vitest";
import { parseCrmNotice } from "./crm-notice";

describe("parseCrmNotice", () => {
  test("reads the HubSpot sign-in outcome", () => {
    expect(parseCrmNotice({ connected: "hubspot" })).toEqual({ kind: "connected" });
    expect(parseCrmNotice({ cancelled: "hubspot" })).toEqual({ kind: "cancelled" });
    expect(parseCrmNotice({ failed: "hubspot", reason: "Already connected." })).toEqual({ kind: "failed", reason: "Already connected." });
  });

  test("ignores anything else", () => {
    expect(parseCrmNotice({ connected: "google-ads" })).toBeUndefined();
    expect(parseCrmNotice({})).toBeUndefined();
  });
});
