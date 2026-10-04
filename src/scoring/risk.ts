import { scenarioKeys, type ScenarioKey } from "@/src/assessment/content";
import {
  getScoringRule,
  MAXIMUM_SCORE,
  MINIMUM_SCORE,
  type ScoringRule,
} from "@/src/scoring/rubric";

export type RiskCategory = "low" | "medium" | "high";

export type ScoreAnswer = {
  scenarioKey: ScenarioKey;
  optionId: string;
};

export type AssessmentScore = {
  totalScore: number;
  percentage: number;
  risk: RiskCategory;
  contributions: ReadonlyMap<ScenarioKey, number>;
  rules: ReadonlyMap<ScenarioKey, ScoringRule>;
};

/**
 * Version 2 risk bands use the unrounded percentage of the 0-80 score.
 */
export function classifyRisk(percentage: number): RiskCategory {
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100)
    throw new TypeError("Percentage must be between 0 and 100");
  if (percentage <= 50) return "high";
  if (percentage <= 70) return "medium";
  return "low";
}

export function scorePercentage(totalScore: number): number {
  if (!Number.isInteger(totalScore) || totalScore < 0 || totalScore > 80)
    throw new TypeError("Score must be an integer between 0 and 80");
  return totalScore * 1.25;
}

export function classifyResponseRisk(contribution: number): RiskCategory {
  if (contribution === 0 || contribution === 2) return "high";
  if (contribution === 4 || contribution === 6) return "medium";
  if (contribution === 8 || contribution === 10) return "low";
  throw new TypeError("Unsupported response contribution");
}

/**
 * The single deterministic assessment scoring implementation used by web
 * attempts and future questionnaire imports. Stable option IDs, rather than
 * translated labels or display positions, select the rule.
 */
export function calculateAssessmentScore(
  answers: readonly ScoreAnswer[],
): AssessmentScore {
  if (answers.length !== scenarioKeys.length) {
    throw new Error("Exactly eight answers are required");
  }

  const answerKeys = new Set(answers.map(({ scenarioKey }) => scenarioKey));
  if (
    answerKeys.size !== scenarioKeys.length ||
    scenarioKeys.some((key) => !answerKeys.has(key))
  ) {
    throw new Error("Answers must contain each scenario exactly once");
  }

  const contributions = new Map<ScenarioKey, number>();
  const rules = new Map<ScenarioKey, ScoringRule>();
  for (const answer of answers) {
    const rule = getScoringRule(answer.scenarioKey, answer.optionId);
    if (!rule || !Number.isInteger(rule.contribution)) {
      throw new Error(
        `Approved rubric entry missing for ${answer.scenarioKey}`,
      );
    }
    contributions.set(answer.scenarioKey, rule.contribution);
    rules.set(answer.scenarioKey, rule);
  }

  const totalScore = [...contributions.values()].reduce(
    (total, contribution) => total + contribution,
    0,
  );
  if (totalScore < MINIMUM_SCORE || totalScore > MAXIMUM_SCORE) {
    throw new Error("Score is outside the approved raw range");
  }

  const percentage = scorePercentage(totalScore);
  return {
    totalScore,
    percentage,
    risk: classifyRisk(percentage),
    contributions,
    rules,
  };
}
