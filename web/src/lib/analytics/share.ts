/** Whole percentages that sum to exactly 100 (largest remainder method). */
export function roundShares(shares: number[]): number[] {
  const total = shares.reduce((sum, share) => sum + share, 0);
  if (total === 0) return shares.map(() => 0);
  const exact = shares.map((share) => (share / total) * 100);
  const floors = exact.map(Math.floor);
  let remaining = 100 - floors.reduce((sum, value) => sum + value, 0);
  const byRemainder = exact.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((a, b) => b.remainder - a.remainder);
  const result = [...floors];
  for (const { index } of byRemainder) {
    if (remaining <= 0) break;
    result[index] += 1;
    remaining -= 1;
  }
  return result;
}

interface ScopeChannel {
  channelCode: string;
  included: boolean;
}

/** The scope tag on readouts: "CH·ALL", "CH·01, 02", or one campaign's channel. */
export function scopeTag(channels: ScopeChannel[], campaignChannelCode: string | null): string {
  if (campaignChannelCode) return `${campaignChannelCode} · 1 campaign`;
  if (channels.every((channel) => channel.included)) return "CH·ALL";
  const numbers = channels.filter((channel) => channel.included).map((channel) => channel.channelCode.replace("CH·", ""));
  return `CH·${numbers.join(", ")}`;
}
