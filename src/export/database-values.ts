export function coerceDatabaseDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("The database returned an invalid assessment timestamp.");
  }
  return parsed;
}
