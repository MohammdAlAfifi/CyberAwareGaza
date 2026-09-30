import { describe, expect, it } from "vitest";
import { scenarioKeys } from "@/src/assessment/content";
import { calculateAssessmentScore, classifyRisk } from "./risk";

describe("classifyRisk", () => {
  it.each([
    [9, "high"],
    [10, "medium"],
    [24, "medium"],
    [25, "low"],
  ] as const)("classifies boundary score %i as %s", (score, expected) => {
    expect(classifyRisk(score)).toBe(expected);
  });

  it("supports negative scores without inventing a lower bound", () => {
    expect(classifyRisk(-1)).toBe("high");
  });

  it("rejects fractional scores", () => {
    expect(() => classifyRisk(10.5)).toThrow(TypeError);
  });
});

describe("calculateAssessmentScore", () => {
  const answers = scenarioKeys.map((scenarioKey) => ({
    scenarioKey,
    optionId: `${scenarioKey}O1`,
  }));
  const rubric = answers.map((answer, index) => ({
    ...answer,
    contribution: index === 0 ? 4 : 3,
  }));

  it("uses approved rubric contributions and the existing thresholds", () => {
    expect(calculateAssessmentScore(answers, rubric)).toMatchObject({
      totalScore: 25,
      risk: "low",
    });
  });

  it("rejects incomplete, duplicate, or unmapped submissions", () => {
    expect(() => calculateAssessmentScore(answers.slice(0, 7), rubric)).toThrow(
      "Exactly eight answers",
    );
    expect(() =>
      calculateAssessmentScore([...answers.slice(0, 7), answers[0]], rubric),
    ).toThrow("each scenario exactly once");
    expect(() =>
      calculateAssessmentScore(
        answers.map((answer, index) =>
          index === 7 ? { ...answer, optionId: "unknown" } : answer,
        ),
        rubric,
      ),
    ).toThrow("Approved rubric entry missing for S8");
  });
});
