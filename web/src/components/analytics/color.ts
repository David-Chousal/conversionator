/** CSS color for a channel series: ch-1…ch-6, or ch-other past six. */
export function channelColor(colorIndex: number | null): string {
  return colorIndex ? `var(--ch-${colorIndex})` : "var(--ch-other)";
}
