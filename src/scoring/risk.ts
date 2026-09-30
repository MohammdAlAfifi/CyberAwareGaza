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
  risk: RiskCategory;
  contributions: ReadonlyMap<ScenarioKey, number>;
  rules: ReadonlyMap<ScenarioKey, ScoringRule>;
};

/**
 * Chapter 3 Table 3.5 risk bands. The assessment score is a raw cumulative
 * score, not a percentage.
 */
export function classifyRisk(totalScore: number): RiskCategory {
  if (!Number.isInteger(totalScore))
    throw new TypeError("Score must be an integer");
  if (totalScore >= 25) return "low";
  if (totalScore >= 10) return "medium";
  return "high";
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

  return {
    totalScore,
    risk: classifyRisk(totalScore),
    contributions,
    rules,
  };
}
