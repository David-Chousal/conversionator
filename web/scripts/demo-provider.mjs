import { createServer } from "node:http";

const key = process.env.DEMO_SOURCE_KEY || "demo-source-key";
const port = Number(process.env.DEMO_SOURCE_PORT || 4001);
const multiplier = Number(process.env.DEMO_SPEND_MULTIPLIER || 1);
if (!Number.isFinite(multiplier) || multiplier < 0) throw new Error("DEMO_SPEND_MULTIPLIER must be nonnegative");

const campaigns = [
  { id: "spring-launch", name: "Spring Launch" },
  { id: "brand-awareness", name: "Brand Awareness" },
  { id: "retargeting", name: "Retargeting" },
];

const data = campaigns.flatMap((campaign, index) => Array.from({ length: 30 }, (_, day) => ({
  date: `2026-09-${String(day + 1).padStart(2, "0")}`,
  campaignId: campaign.id,
  campaign: campaign.name,
  spendCents: Math.round((4500 + index * 2900 + (day * 137 + index * 83) % 2100) * multiplier),
  clicks: 42 + index * 25 + (day * 7 + index * 3) % 38,
  engagements: 65 + index * 31 + (day * 11 + index * 5) % 56,
  impressions: 3000 + index * 1500 + day * 31,
  conversions: 3 + index + day % 4,
})));

createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url !== "/v1/metrics" || request.method !== "GET") {
    response.writeHead(404).end(JSON.stringify({ error: "Not found" }));
  } else if (request.headers.authorization !== `Bearer ${key}`) {
    response.writeHead(401).end(JSON.stringify({ error: "Unauthorized" }));
  } else {
    response.writeHead(200).end(JSON.stringify({ data }));
  }
}).listen(port, "127.0.0.1", () => console.log(`Demo Ads API listening at http://127.0.0.1:${port}`));
