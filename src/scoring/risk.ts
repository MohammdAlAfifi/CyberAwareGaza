export type RiskCategory = "low" | "medium" | "high";

/**
 * The only scoring rule currently verified by an authoritative source.
 * Option contributions and the possible score range remain source-gated.
 */
export function classifyRisk(totalScore: number): RiskCategory {
  if (!Number.isInteger(totalScore)) throw new TypeError("Score must be an integer");
  if (totalScore >= 25) return "low";
  if (totalScore >= 10) return "medium";
  return "high";
}
