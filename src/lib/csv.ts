const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeSpreadsheetFormula(value: string): string {
  return FORMULA_PREFIX.test(value) ? `'${value}` : value;
}
