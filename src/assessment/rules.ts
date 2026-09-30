import { scenarioKeys, type ScenarioKey } from "./content";

export type SubmittedAnswer = {
  scenarioKey: ScenarioKey;
  optionId: string;
};

export function consentAllowsAssessment(decision: boolean): boolean {
  return decision === true;
}

export function hasCompleteAnswerSet(
  answers: readonly SubmittedAnswer[],
): boolean {
  if (answers.length !== scenarioKeys.length) return false;
  const keys = new Set(answers.map(({ scenarioKey }) => scenarioKey));
  return (
    keys.size === scenarioKeys.length &&
    scenarioKeys.every((key) => keys.has(key))
  );
}
