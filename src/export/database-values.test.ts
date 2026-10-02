import { describe, expect, it } from "vitest";

import { coerceDatabaseDate } from "@/src/export/database-values";

describe("export database values", () => {
  it("normalizes PostgreSQL timestamp strings returned by raw Drizzle queries", () => {
    expect(
      coerceDatabaseDate("2026-09-30 22:42:55.415302+00")?.toISOString(),
    ).toBe("2026-09-30T22:42:55.415Z");
  });

  it("preserves valid dates and nulls while rejecting invalid timestamps", () => {
    const date = new Date("2026-09-30T22:42:55.415Z");
    expect(coerceDatabaseDate(date)).toBe(date);
    expect(coerceDatabaseDate(null)).toBeNull();
    expect(() => coerceDatabaseDate("not-a-date")).toThrow(/invalid/i);
  });
});
