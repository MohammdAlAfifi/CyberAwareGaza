import { ratingFields } from "@/src/feedback/validation";

export type FeedbackQuestion = (typeof ratingFields)[number];
export type RatingCount = {
  question: FeedbackQuestion;
  rating: number;
  count: number;
};

// Keep full precision here. Round only labels, never counts or chart widths.
export function feedbackPercentage(
  count: number,
  total: number,
): number | null {
  return total > 0 ? (count / total) * 100 : null;
}

export function feedbackRatingSummary(
  question: FeedbackQuestion,
  rows: RatingCount[],
) {
  const counts = [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: rows
      .filter((row) => row.question === question && row.rating === rating)
      .reduce((sum, row) => sum + Number(row.count), 0),
  }));
  const validCount = counts.reduce((sum, item) => sum + item.count, 0);
  const sum = counts.reduce(
    (total, item) => total + item.rating * item.count,
    0,
  );
  return {
    question,
    validCount,
    mean: validCount > 0 ? sum / validCount : null,
    distribution: counts.map((item) => ({
      ...item,
      percentage: feedbackPercentage(item.count, validCount),
    })),
  };
}
