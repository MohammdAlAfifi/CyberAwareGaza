import Link from "next/link";

import { AnalyticsSourceFilter } from "@/components/analytics-source-filter";
import { AdminShell } from "@/components/admin-shell";
import { DonutChart } from "@/components/donut-chart";
import { RiskBadge } from "@/components/admin-records";
import { percentage } from "@/src/admin/analytics";
import type { AnalyticsDashboard } from "@/src/admin/analytics-service";
import { getAdminCopy } from "@/src/admin/copy";
import { formatAdminDate } from "@/src/admin/format";
import type { Locale } from "@/src/i18n";

export function AdminDashboardView({
  actorName,
  data,
  locale,
}: {
  actorName: string;
  data: AnalyticsDashboard;
  locale: Locale;
}) {
  const t = getAdminCopy(locale);
  const sourceName =
    data.source === "web"
      ? t.websiteAssessments
      : data.source === "google_form"
        ? t.googleFormAssessments
        : t.combinedResults;
  const scoreDenominator = data.attempts.currentVersion;
  const accountDenominator =
    data.participants.registered + data.participants.anonymous;
  const metricCards = [
    { label: t.totalParticipants, value: data.participants.total },
    { label: t.registeredUsers, value: data.participants.registered },
    { label: t.anonymousParticipants, value: data.participants.anonymous },
    { label: t.completedAssessments, value: data.attempts.eligible },
    {
      label: t.averageScore,
      value:
        data.attempts.averageScore === null
          ? "—"
          : data.attempts.averageScore.toFixed(1),
      detail: t.rawScoreUnit,
    },
    {
      label: t.lowRiskPercent,
      value: `${percentage(data.attempts.low, scoreDenominator).toFixed(1)}%`,
    },
    {
      label: t.mediumRiskPercent,
      value: `${percentage(data.attempts.medium, scoreDenominator).toFixed(1)}%`,
    },
    {
      label: t.highRiskPercent,
      value: `${percentage(data.attempts.high, scoreDenominator).toFixed(1)}%`,
    },
  ];

  return (
    <AdminShell
      actorName={actorName}
      intro={t.dashboardIntro}
      locale={locale}
      title={t.dashboardTitle}
    >
      <AnalyticsSourceFilter
        locale={locale}
        pathname={`/${locale}/admin`}
        source={data.source}
      />
      <section className="analytics-scope panel" aria-label={t.analyticsSource}>
        <strong>{t.activeSource.replace("{source}", sourceName)}</strong>
        <p>{t.participantScope}</p>
        <p>{t.assessmentScope}</p>
        {data.activeVersion ? (
          <p>
            {t.versionScope.replace(
              "{version}",
              `${data.activeVersion.contentLabel} / ${data.activeVersion.rubricLabel}`,
            )}
          </p>
        ) : (
          <p className="admin-warning">{t.noActiveVersion}</p>
        )}
        {data.versions.length > 0 && (
          <p>
            {t.detectedVersions.replace(
              "{versions}",
              data.versions
                .map(
                  (version) =>
                    `${version.contentVersionId} / ${version.rubricVersionId} (${version.count})`,
                )
                .join(", "),
            )}
          </p>
        )}
        {data.attempts.excludedByVersion > 0 && (
          <p className="admin-warning">
            {t.incompatibleVersions.replace(
              "{count}",
              String(data.attempts.excludedByVersion),
            )}
          </p>
        )}
      </section>

      <section
        className="metric-grid analytics-metric-grid"
        aria-label={t.dashboardTitle}
      >
        {metricCards.map((metric) => (
          <article className="panel metric-card" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            {metric.detail && <small>{metric.detail}</small>}
          </article>
        ))}
      </section>

      <section className="analytics-chart-grid">
        <DonutChart
          chartId="risk-distribution"
          centerLabel={t.eligibleAttempts}
          centerValue={scoreDenominator}
          description={t.assessmentScope}
          emptyLabel={t.noEligibleAssessments}
          items={data.riskDistribution.map((item) => ({
            ...item,
            label:
              item.id === "low"
                ? t.low
                : item.id === "medium"
                  ? t.medium
                  : t.high,
            color:
              item.id === "low"
                ? "#16835f"
                : item.id === "medium"
                  ? "#c27a05"
                  : "#c7393f",
          }))}
          title={t.riskDistribution}
        />
        <DonutChart
          chartId="account-distribution"
          centerLabel={t.classifiedParticipants}
          centerValue={accountDenominator}
          description={t.participantScope}
          emptyLabel={t.noClassifiedParticipants}
          items={data.accountDistribution.map((item) => ({
            ...item,
            label: item.id === "registered" ? t.registered : t.anonymous,
            color: item.id === "registered" ? "#12324a" : "#149b92",
          }))}
          title={t.accountDistribution}
        />
      </section>

      <div className="analytics-notes">
        <p>{t.percentageRounding}</p>
        {data.participants.imported > 0 && (
          <p>
            {t.importedAccountNote.replace(
              "{count}",
              String(data.participants.imported),
            )}
          </p>
        )}
      </div>

      <section className="panel admin-table-shell">
        <div className="table-heading">
          <div>
            <h2>{t.recentAssessments}</h2>
            <p>{t.assessmentScope}</p>
          </div>
          <Link
            className="button button-ghost"
            href={`/${locale}/admin/assessments`}
          >
            {t.viewAll}
          </Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="admin-empty">{t.noEligibleAssessments}</p>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.participant}</th>
                  <th>{t.participantId}</th>
                  <th>{t.accountType}</th>
                  <th>{t.source}</th>
                  <th>{t.rawScore}</th>
                  <th>{t.risk}</th>
                  <th>{t.submitted}</th>
                  <th>
                    <span className="sr-only">{t.viewDetails}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.displayName}</strong>
                    </td>
                    <td>
                      <bdi dir="ltr">{row.publicCode}</bdi>
                    </td>
                    <td>{t[row.participantType]}</td>
                    <td>
                      <span
                        className={`source-label source-label--${row.source}`}
                      >
                        {row.source === "web" ? t.website : t.googleForm}
                      </span>
                    </td>
                    <td>{row.totalScore ?? "—"}</td>
                    <td>
                      <RiskBadge locale={locale} risk={row.risk} />
                    </td>
                    <td>{formatAdminDate(row.completedAt, locale)}</td>
                    <td>
                      <Link
                        className="table-link"
                        href={`/${locale}/admin/assessments/${row.id}`}
                      >
                        {t.viewDetails}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
