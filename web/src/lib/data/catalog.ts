import type { Platform } from "./types";

export interface PlatformInfo {
  platform: Platform;
  name: string;
  /** Placeholder for the vendor's official logo. */
  monogram: string;
  /** What COR pulls, shown while the platform is not connected. */
  provides: string;
  rowsPerSync: number;
}

export const PLATFORMS: readonly PlatformInfo[] = [
  { platform: "google-ads", name: "Google Ads", monogram: "G", provides: "Spend, clicks, conversions, search terms", rowsPerSync: 4120 },
  { platform: "meta-ads", name: "Meta Ads", monogram: "M", provides: "Facebook and Instagram spend, reach, conversions", rowsPerSync: 3380 },
  { platform: "linkedin-ads", name: "LinkedIn Ads", monogram: "in", provides: "Spend, leads, company targeting", rowsPerSync: 940 },
  { platform: "tiktok-ads", name: "TikTok Ads", monogram: "T", provides: "Spend, video views, conversions", rowsPerSync: 2250 },
  { platform: "microsoft-ads", name: "Microsoft Ads", monogram: "Ms", provides: "Bing search spend, clicks, conversions", rowsPerSync: 1180 },
];

export function platformInfo(platform: Platform): PlatformInfo {
  const info = PLATFORMS.find((entry) => entry.platform === platform);
  if (!info) throw new Error(`Unknown platform: ${platform}`);
  return info;
}
