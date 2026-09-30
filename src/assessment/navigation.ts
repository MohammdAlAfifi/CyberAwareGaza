import type { Locale } from "@/src/i18n";

export function assessmentScenarioPath(
  locale: Locale,
  scenarioNumber: number,
): string {
  const normalized = Math.min(8, Math.max(1, Math.trunc(scenarioNumber)));
  return `/${locale}/assessment?scenario=${normalized}`;
}
