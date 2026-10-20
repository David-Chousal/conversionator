const NEEDS_QUOTES = /[",\r\n]/;
// Cells starting with these run as formulas in spreadsheet apps (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** RFC 4180 CSV with CRLF line endings. */
export function toCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((cells) => cells.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}
