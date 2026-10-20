import { formatDay } from "@/lib/analytics/dates";
import type { ColumnFormat } from "@/lib/data/datasets";
import { formatCount, formatMoney, formatRate } from "@/lib/format";

/** A record cell as the user reads it. */
export function formatCell(value: string | number | undefined, format: ColumnFormat, currency: string): string {
  if (value === undefined || value === "") return "—";
  if (format === "text") return String(value);
  if (format === "date") return formatDay(String(value));
  const number = Number(value);
  if (format === "money") return formatMoney(number, { currency });
  if (format === "percent") return formatRate(number);
  return formatCount(number);
}
