const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Terse age for tags and signal meters: "now", "4m", "6h", "3d". */
export function formatAge(elapsedMs: number): string {
  if (elapsedMs < MINUTE) return "now";
  if (elapsedMs < HOUR) return `${Math.floor(elapsedMs / MINUTE)}m`;
  if (elapsedMs < DAY) return `${Math.floor(elapsedMs / HOUR)}h`;
  return `${Math.floor(elapsedMs / DAY)}d`;
}

/** Grouped whole number: 4120 → "4,120". */
export function formatCount(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

const MINUS = "−";

export function currencySymbol(currency: string): string {
  const parts = new Intl.NumberFormat("en-US", { style: "currency", currency }).formatToParts(0);
  return parts.find((part) => part.type === "currency")?.value ?? currency;
}

function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return Math.round(value).toString();
}

interface MoneyOptions {
  currency?: string;
  /** One-decimal k / M, for ledgers, rings and axis ticks only. */
  compact?: boolean;
  /** Keep cents at any size (CPA, CPC, CPM). */
  cents?: boolean;
}

/** Money per the design system: whole dollars from $100, cents below, true minus. */
export function formatMoney(value: number, { currency = "USD", compact = false, cents = false }: MoneyOptions = {}): string {
  const sign = value < 0 ? MINUS : "";
  const amount = Math.abs(value);
  const symbol = currencySymbol(currency);
  if (compact) return `${sign}${symbol}${compactNumber(amount)}`;
  const digits = cents || amount < 100 ? 2 : 0;
  const body = amount.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${sign}${symbol}${body}`;
}

export function formatRoas(value: number): string {
  return `${value.toFixed(1)}×`;
}

/** Small rates such as CTR: two decimals. */
export function formatRate(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}

export function formatCompactCount(value: number): string {
  return value >= 1_000_000 ? `${(value / 1_000_000).toFixed(2)}M` : formatCount(value);
}

export type ChangeKind = "percent" | "money" | "roas" | "count";

/** A signed change for readouts and tables: "+12.4%", "−$2.10", "+0.6", "+1,204". */
export function formatChange(delta: number, kind: ChangeKind, currency = "USD"): string {
  const sign = delta < 0 ? MINUS : "+";
  const amount = Math.abs(delta);
  if (kind === "percent") return `${sign}${(amount * 100).toFixed(1)}%`;
  if (kind === "money") return `${sign}${formatMoney(amount, { currency, cents: true })}`;
  if (kind === "roas") return `${sign}${amount.toFixed(1)}`;
  return `${sign}${formatCount(amount)}`;
}
