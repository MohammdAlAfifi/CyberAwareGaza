import Link from "next/link";

import { AnalyticsSourceFilter } from "@/components/analytics-source-filter";
import { AdminShell } from "@/components/admin-shell";
import { DonutChart } from "@/components/donut-chart";
import type { ScenarioAnalytics } from "@/src/admin/analytics-service";
import type { AnalyticsSource } from "@/src/admin/analytics";
import { getAdminCopy } from "@/src/admin/copy";
import type { Locale } from "@/src/i18n";

const optionColors = ["#12324a", "#149b92", "#c27a05", "#8c5ba6"];

function sourceName(locale: Locale, source: AnalyticsSource) {
  const t = getAdminCopy(locale);
  return source === "web"
    ? t.websiteAssessments
    : source === "google_form"
      ? t.googleFormAssessments
      : t.combinedResults;
}

function scenarioTitle(locale: Locale, order: number) {
  return getAdminCopy(locale).scenarioNumber.replace("{number}", String(order));
}

export function ScenarioAnalyticsOverview({
  actorName,
  activeVersion,
  eligibleAssessments,
  eligibleAttempts,
  locale,
  scenarios,
  source,
  versions,
}: {
  actorName: string;
  activeVersion: { contentLabel: string; rubricLabel: string } | null;
  eligibleAssessments: number;
  eligibleAttempts: number;
  locale: Locale;
  scenarios: ScenarioAnalytics[];
  source: AnalyticsSource;
  versions: Array<{
    contentVersionId: string;
    rubricVersionId: string;
    count: number;
  }>;
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
      <section className="analytics-scope panel" aria-label={t.analyticsSource}>
        <strong>
          {t.activeSource.replace("{source}", sourceName(locale, source))}
        </strong>
        <p>{t.assessmentScope}</p>
        <p>
          {t.attemptsDenominator.replace("{count}", String(eligibleAttempts))}
        </p>
        {activeVersion ? (
          <p>
            {t.versionScope.replace(
              "{version}",
              `${activeVersion.contentLabel} / ${activeVersion.rubricLabel}`,
            )}
          </p>
        ) : (
          <p className="admin-warning">{t.noActiveVersion}</p>
        )}
        {versions.length > 0 && (
          <p>
            {t.detectedVersions.replace(
              "{versions}",
              versions
                .map(
                  (version) =>
                    `${version.contentVersionId} / ${version.rubricVersionId} (${version.count})`,
                )
                .join(", "),
            )}
          </p>
        )}
        {eligibleAssessments > eligibleAttempts && (
          <p className="admin-warning">
            {t.incompatibleVersions.replace(
              "{count}",
              String(eligibleAssessments - eligibleAttempts),
            )}
          </p>
        )}
      </section>
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
                  description={t.responseDenominator.replace(
                    "{count}",
                    String(scenario.eligibleResponses),
                  )}
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
                <p className="scenario-denominator">
                  {t.responseDenominator.replace(
                    "{count}",
                    String(scenario.eligibleResponses),
                  )}
                </p>
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
      <p className="analytics-rounding-note">{t.percentageRounding}</p>
    </AdminShell>
  );
}

export function ScenarioAnalyticsDetail({
  actorName,
  eligibleAssessments,
  eligibleAttempts,
  locale,
  scenario,
  source,
  versions,
}: {
  actorName: string;
  eligibleAssessments: number;
  eligibleAttempts: number;
  locale: Locale;
  scenario: ScenarioAnalytics;
  source: AnalyticsSource;
  versions: Array<{
    contentVersionId: string;
    rubricVersionId: string;
    count: number;
  }>;
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
        <p>{t.activeSource.replace("{source}", sourceName(locale, source))}</p>
        <p>
          {t.attemptsDenominator.replace("{count}", String(eligibleAttempts))}
        </p>
        <p>
          {t.responseDenominator.replace(
            "{count}",
            String(scenario.eligibleResponses),
          )}
        </p>
        {versions.length > 0 && (
          <p>
            {t.detectedVersions.replace(
              "{versions}",
              versions
                .map(
                  (version) =>
                    `${version.contentVersionId} / ${version.rubricVersionId} (${version.count})`,
                )
                .join(", "),
            )}
          </p>
        )}
        {eligibleAssessments > eligibleAttempts && (
          <p className="admin-warning">
            {t.incompatibleVersions.replace(
              "{count}",
              String(eligibleAssessments - eligibleAttempts),
            )}
          </p>
        )}
      </section>
      <section className="scenario-detail-grid">
        <DonutChart
          chartId={`scenario-detail-${scenario.key}`}
          centerLabel={t.totalEligibleResponses}
          centerValue={scenario.eligibleResponses}
          description={t.responseDenominator.replace(
            "{count}",
            String(scenario.eligibleResponses),
          )}
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
      <p className="analytics-rounding-note">{t.percentageRounding}</p>
    </AdminShell>
  );
}
