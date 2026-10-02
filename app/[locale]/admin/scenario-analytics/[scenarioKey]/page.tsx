import { notFound } from "next/navigation";

import { ScenarioAnalyticsDetail } from "@/components/scenario-analytics";
import { parseAnalyticsSource } from "@/src/admin/analytics";
import { getScenarioAnalytics } from "@/src/admin/analytics-service";
import { isScenarioKey } from "@/src/assessment/content";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function ScenarioAnalyticsDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; scenarioKey: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, scenarioKey } = await params;
  if (!isLocale(locale) || !isScenarioKey(scenarioKey)) notFound();
  const actor = await requireAdmin(locale);
  const source = parseAnalyticsSource((await searchParams).source);
  const data = await getScenarioAnalytics(actor, source, scenarioKey);
  const scenario = data.scenarios[0];
  if (!scenario) notFound();
  return (
    <ScenarioAnalyticsDetail
      actorName={actor.displayName}
      eligibleAssessments={data.eligibleAssessments}
      eligibleAttempts={data.eligibleAttempts}
      locale={locale}
      scenario={scenario}
      source={source}
      versions={data.versions}
    />
  );
}
