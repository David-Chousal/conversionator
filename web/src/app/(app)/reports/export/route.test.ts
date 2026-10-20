import { describe, expect, test } from "vitest";
import { POST } from "./route";

const post = (body: string) => POST(new Request("http://localhost/reports/export", { method: "POST", body }));
const input = { name: "Spend check", metrics: ["spend", "roas"], platforms: ["google-ads"], window: { kind: "rolling", days: 30 }, compare: true, format: "csv", schedule: "none", recipients: [] };

describe("POST /reports/export", () => {
  test("sends a CSV download named after the report", async () => {
    const response = await post(JSON.stringify(input));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toMatch(/^attachment; filename="spend-check-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv"$/);
    expect((await response.text()).split("\r\n")[0]).toBe("Channel,Campaign,Ad spend (USD),ROAS");
  });

  test("sends a PDF", async () => {
    const response = await post(JSON.stringify({ ...input, format: "pdf" }));
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
  });

  test("explains what's missing instead of exporting", async () => {
    const response = await post(JSON.stringify({ ...input, metrics: [] }));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "Pick at least one metric." });
  });

  test("rejects unreadable requests", async () => {
    expect((await post("{nope")).status).toBe(400);
  });
});
