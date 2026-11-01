import { describe, expect, it } from "vitest";

import { feedbackInputSchema, ratingFields } from "./validation";

const valid = {
  attemptId: "4b50db4d-e7a2-44b6-9b30-7d75e5032a18",
  navigationRating: 1,
  scenarioClarityRating: 2,
  interactionRating: 3,
  readabilityRating: 4,
  satisfactionRating: 5,
  technicalProblem: false,
  consent: true,
  language: "ar",
};

describe("assessment feedback validation", () => {
  it("accepts individual numeric answers, both languages and an optional comment", () => {
    expect(feedbackInputSchema.parse(valid)).toEqual(valid);
    expect(
      feedbackInputSchema.parse({
        ...valid,
        language: "en",
        technicalProblem: true,
        comments: "  Useful  ",
      }).comments,
    ).toBe("Useful");
  });

  it.each(ratingFields)("requires a bounded integer for %s", (field) => {
    for (const value of [undefined, null, 0, 6, 2.5, "5", true]) {
      expect(
        feedbackInputSchema.safeParse({ ...valid, [field]: value }).success,
      ).toBe(false);
    }
  });

  it("rejects missing consent, missing technical answers, unsupported language and identity injection", () => {
    for (const input of [
      { ...valid, consent: false },
      { ...valid, consent: undefined },
      { ...valid, technicalProblem: undefined },
      { ...valid, technicalProblem: "no" },
      { ...valid, language: "fr" },
      { ...valid, participantId: "browser-owned-id" },
      { ...valid, accountId: "browser-owned-id" },
      { ...valid, attemptId: "invalid" },
    ])
      expect(feedbackInputSchema.safeParse(input).success).toBe(false);
  });

  it("bounds comments before trimming", () => {
    expect(
      feedbackInputSchema.safeParse({ ...valid, comments: "م".repeat(2000) })
        .success,
    ).toBe(true);
    expect(
      feedbackInputSchema.safeParse({ ...valid, comments: " ".repeat(2001) })
        .success,
    ).toBe(false);
  });
});
