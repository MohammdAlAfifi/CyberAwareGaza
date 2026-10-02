import { describe, expect, it } from "vitest";

import { parseExportFilters } from "@/src/export/filters";

describe("export filters", () => {
  it("uses Asia/Hebron day boundaries including the correct offset", () => {
    const winter = parseExportFilters(
      new URLSearchParams("from=2026-01-10&to=2026-01-10"),
    );
    expect(winter.from?.toISOString()).toBe("2026-01-09T22:00:00.000Z");
    expect(winter.to?.toISOString()).toBe("2026-01-10T21:59:59.999Z");

    const summer = parseExportFilters(
      new URLSearchParams("from=2026-07-10&to=2026-07-10"),
    );
    expect(summer.from?.toISOString()).toBe("2026-07-09T21:00:00.000Z");
    expect(summer.to?.toISOString()).toBe("2026-07-10T20:59:59.999Z");
  });

  it("falls back safely for unsupported source, risk, locale, and dates", () => {
    expect(
      parseExportFilters(
        new URLSearchParams("source=x&risk=x&locale=fr&from=nope"),
      ),
    ).toEqual({
      source: "all",
      risk: "all",
      locale: "en",
      from: null,
      to: null,
    });
  });
});
