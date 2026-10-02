import { describe, expect, it } from "vitest";

import {
  distribution,
  parseAnalyticsSource,
  percentage,
} from "@/src/admin/analytics";

describe("admin analytics helpers", () => {
  it("accepts only supported provenance filters", () => {
    expect(parseAnalyticsSource("web")).toBe("web");
    expect(parseAnalyticsSource("google_form")).toBe("google_form");
    expect(parseAnalyticsSource("forged")).toBe("all");
    expect(parseAnalyticsSource(["web", "google_form"])).toBe("web");
  });

  it("returns safe, one-decimal percentages", () => {
    expect(percentage(1, 3)).toBe(33.3);
    expect(percentage(0, 0)).toBe(0);
    expect(percentage(4, 0)).toBe(0);
  });

  it("uses the supplied denominator without inventing responses", () => {
    expect(
      distribution(
        [
          { id: "a", count: 2 },
          { id: "b", count: 1 },
          { id: "c", count: 0 },
        ],
        3,
      ),
    ).toEqual([
      { id: "a", count: 2, percentage: 66.7 },
      { id: "b", count: 1, percentage: 33.3 },
      { id: "c", count: 0, percentage: 0 },
    ]);
  });
});
