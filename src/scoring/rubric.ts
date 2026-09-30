import rubricData from "./rubric-v1.json";

import type { Locale } from "@/src/i18n";
import type { ScenarioKey } from "@/src/assessment/content";

export const RUBRIC_VERSION = rubricData.id;
export const RUBRIC_LABEL = rubricData.label;
export const MINIMUM_SCORE = rubricData.minimumScore;
export const MAXIMUM_SCORE = rubricData.maximumScore;

export type ScoringRule = {
  scenarioKey: ScenarioKey;
  optionId: string;
  contribution: number;
  explanation: Record<Locale, string>;
  guidance: Record<Locale, string>;
};

export const scoringRules = rubricData.entries as readonly ScoringRule[];

const scoringRuleBySelection = new Map(
  scoringRules.map((rule) => [`${rule.scenarioKey}:${rule.optionId}`, rule]),
);

export function getScoringRule(
  scenarioKey: ScenarioKey,
  optionId: string,
): ScoringRule | undefined {
  return scoringRuleBySelection.get(`${scenarioKey}:${optionId}`);
}

export function feedbackKeyFor(
  rule: Pick<ScoringRule, "scenarioKey" | "optionId">,
) {
  return `${RUBRIC_VERSION}:${rule.scenarioKey}:${rule.optionId}`;
}
