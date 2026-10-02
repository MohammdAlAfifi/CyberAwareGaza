import Link from "next/link";

import { AnalyticsSourceFilter } from "@/components/analytics-source-filter";
import { AdminShell } from "@/components/admin-shell";
import { DonutChart } from "@/components/donut-chart";
import type { ScenarioAnalytics } from "@/src/admin/analytics-service";
import type { AnalyticsSource } from "@/src/admin/analytics";
import { getAdminCopy } from "@/src/admin/copy";
import type { Locale } from "@/src/i18n";

const optionColors = ["#12324a", "#159a9c", "#0b6f72", "#76c8c9"];

function scenarioTitle(locale: Locale, order: number) {
  return getAdminCopy(locale).scenarioNumber.replace("{number}", String(order));
}

export function ScenarioAnalyticsOverview({
  actorName,
  locale,
  scenarios,
  source,
}: {
  actorName: string;
  locale: Locale;
  scenarios: ScenarioAnalytics[];
  source: AnalyticsSource;
}) {
  const t = getAdminCopy(locale);
  return (
    <AdminShell
      actorName={actorName}
      intro={t.analyticsText}
      locale={locale}
      title={t.analyticsTitle}
    >
      <AnalyticsSourceFilter
        locale={locale}
        pathname={`/${locale}/admin/scenario-analytics`}
        source={source}
      />
      {scenarios.length === 0 ? (
        <section className="panel admin-empty-state">
          <h2>{t.unavailable}</h2>
          <p>{t.noActiveVersion}</p>
        </section>
      ) : (
        <section
          className="scenario-analytics-grid"
          aria-label={t.analyticsTitle}
        >
          {scenarios.map((scenario) => {
            const title = scenarioTitle(locale, scenario.order);
            const query = source === "all" ? "" : `?source=${source}`;
            return (
              <article className="scenario-analytics-card" key={scenario.key}>
                <header>
                  <p className="eyebrow">
                    <bdi dir="ltr">{scenario.key}</bdi>
                  </p>
                  <h2>{title}</h2>
                  <p className="scenario-question">
                    {locale === "ar"
                      ? scenario.questionAr
                      : scenario.questionEn}
                  </p>
                </header>
                <DonutChart
                  chartId={`scenario-${scenario.key}`}
                  centerLabel={t.totalEligibleResponses}
                  centerValue={scenario.eligibleResponses}
                  description={t.totalEligibleResponses}
                  emptyLabel={t.noScenarioResponses}
                  items={scenario.options.map((option, index) => ({
                    id: option.id,
                    label: locale === "ar" ? option.textAr : option.textEn,
                    count: option.count,
                    percentage: option.percentage,
                    color: optionColors[index] ?? "#657883",
                  }))}
                  title={t.responseDistribution}
                />
                <Link
                  className="table-link scenario-detail-link"
                  href={`/${locale}/admin/scenario-analytics/${scenario.key}${query}`}
                >
                  {t.detailedAnalytics}
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </AdminShell>
  );
}

export function ScenarioAnalyticsDetail({
  actorName,
  locale,
  scenario,
  source,
}: {
  actorName: string;
  locale: Locale;
  scenario: ScenarioAnalytics;
  source: AnalyticsSource;
}) {
  const t = getAdminCopy(locale);
  const title = t.scenarioDetailsTitle.replace(
    "{number}",
    String(scenario.order),
  );
  const backQuery = source === "all" ? "" : `?source=${source}`;
  return (
    <AdminShell
      actorName={actorName}
      intro={t.analyticsText}
      locale={locale}
      title={title}
    >
      <div className="admin-detail-actions">
        <Link
          className="button button-ghost"
          href={`/${locale}/admin/scenario-analytics${backQuery}`}
        >
          {t.backToScenarios}
        </Link>
      </div>
      <section className="panel scenario-detail-question">
        <p className="eyebrow">
          <bdi dir="ltr">{scenario.key}</bdi>
        </p>
        <h2>{locale === "ar" ? scenario.questionAr : scenario.questionEn}</h2>
      </section>
      <section className="scenario-detail-grid">
        <DonutChart
          chartId={`scenario-detail-${scenario.key}`}
          centerLabel={t.totalEligibleResponses}
          centerValue={scenario.eligibleResponses}
          description={t.totalEligibleResponses}
          emptyLabel={t.noScenarioResponses}
          items={scenario.options.map((option, index) => ({
            id: option.id,
            label: locale === "ar" ? option.textAr : option.textEn,
            count: option.count,
            percentage: option.percentage,
            color: optionColors[index] ?? "#657883",
          }))}
          title={t.responseDistribution}
        />
        <section className="panel admin-table-shell">
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.option}</th>
                  <th>{t.count}</th>
                  <th>{t.percentage}</th>
                  <th>{t.scoreDeltaLabel}</th>
                </tr>
              </thead>
              <tbody>
                {scenario.options.map((option) => (
                  <tr key={option.id}>
                    <td>
                      <strong>
                        {locale === "ar" ? option.textAr : option.textEn}
                      </strong>
                      <small>
                        <bdi dir="ltr">{option.id}</bdi>
                      </small>
                    </td>
                    <td>{option.count}</td>
                    <td>{option.percentage.toFixed(1)}%</td>
                    <td>
                      <bdi dir="ltr">
                        {option.contribution > 0
                          ? `+${option.contribution}`
                          : option.contribution}
                      </bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </AdminShell>
  );
}
