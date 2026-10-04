import previousRubricData from "./rubric-v1.json";

import type { Locale } from "@/src/i18n";
import type { ScenarioKey } from "@/src/assessment/content";

export const PREVIOUS_RUBRIC_VERSION = previousRubricData.id;
export const RUBRIC_VERSION = "cyberawaregaza-safe-decisions-v2";
export const RUBRIC_LABEL =
  "CyberAwareGaza 0-80 safe cybersecurity decisions model";
export const MINIMUM_SCORE = 0;
export const MAXIMUM_SCORE = 80;

export type ScoringRule = {
  scenarioKey: ScenarioKey;
  optionId: string;
  contribution: number;
  explanation: Record<Locale, string>;
  guidance: Record<Locale, string>;
};

const convertedContribution = new Map<number, number>([
  [-10, 0],
  [-8, 2],
  [2, 4],
  [4, 6],
  [6, 6],
  [8, 8],
  [10, 10],
]);

/**
 * Version 2 is deliberately derived once from the preserved v1 definition.
 * The S4O2 override is explicit because its approved v2 value is +8.
 */
export const scoringRules = previousRubricData.entries.map((entry) => {
  const contribution =
    entry.optionId === "S4O2"
      ? 8
      : convertedContribution.get(entry.contribution);
  if (contribution === undefined) {
    throw new Error(`Unsupported v1 contribution for ${entry.optionId}`);
  }
  return { ...entry, contribution } as ScoringRule;
}) as readonly ScoringRule[];

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
