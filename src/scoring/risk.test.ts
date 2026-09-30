import { describe, expect, it } from "vitest";

import { assessmentScenarios } from "@/src/assessment/content";
import {
  MAXIMUM_SCORE,
  MINIMUM_SCORE,
  scoringRules,
} from "@/src/scoring/rubric";

import { calculateAssessmentScore, classifyRisk } from "./risk";

const expectedContributions = {
  S1O1: -10,
  S1O2: 10,
  S1O3: 2,
  S2O1: -8,
  S2O2: 10,
  S2O3: 8,
  S3O1: -10,
  S3O2: 10,
  S3O3: 2,
  S4O1: 10,
  S4O2: 10,
  S4O3: -10,
  S4O4: 2,
  S5O1: 10,
  S5O2: -8,
  S5O3: 2,
  S6O1: 10,
  S6O2: -10,
  S6O3: 4,
  S7O1: 10,
  S7O2: -10,
  S7O3: 6,
  S8O1: -10,
  S8O2: 10,
  S8O3: 4,
} as const;

function answersFor(mode: "min" | "max") {
  return assessmentScenarios.map((scenario) => {
    const rules = scoringRules.filter(
      ({ scenarioKey }) => scenarioKey === scenario.key,
    );
    const contribution = Math[mode](...rules.map((rule) => rule.contribution));
    const rule = rules.find((entry) => entry.contribution === contribution)!;
    return { scenarioKey: scenario.key, optionId: rule.optionId };
  });
}

describe("classifyRisk", () => {
  it.each([
    [9, "high"],
    [10, "medium"],
    [24, "medium"],
    [25, "low"],
  ] as const)("classifies boundary score %i as %s", (score, expected) => {
    expect(classifyRisk(score)).toBe(expected);
  });

  it("rejects fractional scores", () => {
    expect(() => classifyRisk(10.5)).toThrow(TypeError);
  });
});

describe("authoritative rule-based scoring", () => {
  it("maps every stable option ID to its approved delta", () => {
    expect(
      Object.fromEntries(
        scoringRules.map((rule) => [rule.optionId, rule.contribution]),
      ),
    ).toEqual(expectedContributions);
  });

  it("locks all four explicit S4 overrides in displayed order", () => {
    expect(
      scoringRules
        .filter(({ scenarioKey }) => scenarioKey === "S4")
        .map(({ optionId, contribution }) => [optionId, contribution]),
    ).toEqual([
      ["S4O1", 10],
      ["S4O2", 10],
      ["S4O3", -10],
      ["S4O4", 2],
    ]);
  });

  it("sums the exact possible raw-score minimum and maximum", () => {
    expect(calculateAssessmentScore(answersFor("min")).totalScore).toBe(
      MINIMUM_SCORE,
    );
    expect(calculateAssessmentScore(answersFor("max")).totalScore).toBe(
      MAXIMUM_SCORE,
    );
    expect([MINIMUM_SCORE, MAXIMUM_SCORE]).toEqual([-76, 80]);
  });

  it("scores identical stable selections in English and Arabic", () => {
    const selectedIds = assessmentScenarios.map(
      (scenario) => scenario.options[scenario.options.length - 1].id,
    );
    const localizedAnswers = (locale: "en" | "ar") =>
      assessmentScenarios.map((scenario, index) => {
        const localizedLabel = scenario.options.find(
          ({ id }) => id === selectedIds[index],
        )![locale];
        const selected = scenario.options.find(
          (option) => option[locale] === localizedLabel,
        )!;
        return { scenarioKey: scenario.key, optionId: selected.id };
      });

    expect(calculateAssessmentScore(localizedAnswers("en"))).toMatchObject(
      calculateAssessmentScore(localizedAnswers("ar")),
    );
  });

  it("rejects incomplete, duplicate, or unmapped submissions", () => {
    const answers = answersFor("max");
    expect(() => calculateAssessmentScore(answers.slice(0, 7))).toThrow(
      "Exactly eight answers",
    );
    expect(() =>
      calculateAssessmentScore([...answers.slice(0, 7), answers[0]]),
    ).toThrow("each scenario exactly once");
    expect(() =>
      calculateAssessmentScore(
        answers.map((answer, index) =>
          index === 7 ? { ...answer, optionId: "unknown" } : answer,
        ),
      ),
    ).toThrow("Approved rubric entry missing for S8");
  });
});
