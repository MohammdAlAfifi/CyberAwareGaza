import { z } from "zod";

export const FEEDBACK_COMMENT_LIMIT = 2000;
export const ratingFields = [
  "navigationRating",
  "scenarioClarityRating",
  "interactionRating",
  "readabilityRating",
  "satisfactionRating",
] as const;

const rating = z.number().int().min(1).max(5);

export const feedbackInputSchema = z.strictObject({
  attemptId: z.uuid(),
  navigationRating: rating,
  scenarioClarityRating: rating,
  interactionRating: rating,
  readabilityRating: rating,
  satisfactionRating: rating,
  technicalProblem: z.boolean(),
  comments: z.string().max(FEEDBACK_COMMENT_LIMIT).trim().optional(),
  consent: z.literal(true),
  language: z.enum(["en", "ar"]),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;
