import { notFound } from "next/navigation";
import { ScenarioAnalyticsOverview } from "@/components/scenario-analytics";
import { parseAnalyticsSource } from "@/src/admin/analytics";
import { getScenarioAnalytics } from "@/src/admin/analytics-service";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function ScenarioAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const source = parseAnalyticsSource((await searchParams).source);
  const data = await getScenarioAnalytics(actor, source);
  return (
    <ScenarioAnalyticsOverview
      actorName={actor.displayName}
      locale={locale}
      scenarios={data.scenarios}
      source={source}
    />
  );
}
