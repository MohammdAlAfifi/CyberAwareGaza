import { describe, expect, it } from "vitest";

import { getFeedbackCopy } from "./feedback-copy";
import {
  feedbackPercentage,
  feedbackRatingSummary,
  type RatingCount,
} from "./feedback-statistics";

describe("feedback calculation definitions", () => {
  it("keeps zero denominators unavailable and does not round intermediate percentages", () => {
    expect(feedbackPercentage(0, 0)).toBeNull();
    expect(feedbackPercentage(1, 3)).toBeCloseTo(33.3333333333);
    expect(feedbackPercentage(1, 3)!.toFixed(1)).toBe("33.3");
  });

  it("counts each rating separately and computes a weighted mean out of five", () => {
    const summary = feedbackRatingSummary("navigationRating", [
      { question: "navigationRating", rating: 1, count: 1 },
      { question: "navigationRating", rating: 5, count: 2 },
      { question: "scenarioClarityRating", rating: 3, count: 10 },
    ]);
    expect(summary.validCount).toBe(3);
    expect(summary.mean).toBeCloseTo(11 / 3);
    expect(summary.distribution.map((item) => item.count)).toEqual([
      1, 0, 0, 0, 2,
    ]);
    expect(summary.distribution[4].percentage).toBeCloseTo(200 / 3);
  });

  it("never counts missing or out-of-range ratings as zero-valued answers", () => {
    const rows = [
      { question: "navigationRating", rating: null, count: 4 },
      { question: "navigationRating", rating: 0, count: 2 },
      { question: "navigationRating", rating: 6, count: 3 },
    ] as unknown as RatingCount[];
    const summary = feedbackRatingSummary("navigationRating", rows);
    expect(summary.validCount).toBe(0);
    expect(summary.mean).toBeNull();
    expect(summary.distribution.every((item) => item.percentage === null)).toBe(
      true,
    );
    const single = feedbackRatingSummary("readabilityRating", [
      { question: "readabilityRating", rating: 4, count: 1 },
    ]);
    expect(single.mean).toBe(4);
    expect(single.distribution[3].percentage).toBe(100);
  });

  it("keeps admin feedback translations aligned and nonempty", () => {
    const en = getFeedbackCopy("en");
    const ar = getFeedbackCopy("ar");
    expect(Object.keys(en)).toEqual(Object.keys(ar));
    expect(en.scale).toHaveLength(5);
    expect(ar.scale).toHaveLength(5);
    expect(en.dimensions).toHaveLength(5);
    expect(ar.dimensions).toHaveLength(5);
    expect(JSON.stringify(en)).not.toContain('""');
    expect(JSON.stringify(ar)).not.toContain('""');
  });
});
