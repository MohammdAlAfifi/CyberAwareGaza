import { escapeSpreadsheetFormula } from "@/src/lib/csv";

export type CsvValue = string | number | boolean | Date | null | undefined;

export function encodeCsv(rows: readonly (readonly CsvValue[])[]): string {
  return `\uFEFF${rows
    .map((row) => row.map((value) => quoteCsv(value)).join(","))
    .join("\r\n")}\r\n`;
}

function quoteCsv(value: CsvValue): string {
  const plain =
    value instanceof Date
      ? value.toISOString()
      : value === null || value === undefined
        ? ""
        : String(value);
  const safe = escapeSpreadsheetFormula(plain);
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
