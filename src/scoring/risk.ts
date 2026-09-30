import { scenarioKeys, type ScenarioKey } from "@/src/assessment/content";

export type RiskCategory = "low" | "medium" | "high";

export type ScoreAnswer = {
  scenarioKey: ScenarioKey;
  optionId: string;
};

export type RubricContribution = ScoreAnswer & {
  contribution: number;
};

export type AssessmentScore = {
  totalScore: number;
  risk: RiskCategory;
  contributions: ReadonlyMap<ScenarioKey, number>;
};

/**
 * The only scoring rule currently verified by an authoritative source.
 * Option contributions and the possible score range remain source-gated.
 */
export function classifyRisk(totalScore: number): RiskCategory {
  if (!Number.isInteger(totalScore))
    throw new TypeError("Score must be an integer");
  if (totalScore >= 25) return "low";
  if (totalScore >= 10) return "medium";
  return "high";
}

/**
 * The single deterministic assessment scoring implementation. Rubric values
 * are data supplied by the active, approved database version; this function
 * never invents or infers per-option weights.
 */
export function calculateAssessmentScore(
  answers: readonly ScoreAnswer[],
  rubric: readonly RubricContribution[],
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
  for (const answer of answers) {
    const match = rubric.find(
      (entry) =>
        entry.scenarioKey === answer.scenarioKey &&
        entry.optionId === answer.optionId,
    );
    if (!match || !Number.isInteger(match.contribution)) {
      throw new Error(
        `Approved rubric entry missing for ${answer.scenarioKey}`,
      );
    }
    contributions.set(answer.scenarioKey, match.contribution);
  }

  const totalScore = [...contributions.values()].reduce(
    (total, contribution) => total + contribution,
    0,
  );
  return { totalScore, risk: classifyRisk(totalScore), contributions };
}
