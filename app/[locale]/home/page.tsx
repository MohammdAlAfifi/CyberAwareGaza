import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icon";
import { Panel } from "@/components/ui/panel";
import { requireParticipant } from "@/src/auth/authorization";
import { getDictionary, isLocale } from "@/src/i18n";
import { getParticipantAssessmentSummary } from "@/src/participants/dashboard";

export const metadata: Metadata = { title: "Participant home" };

export default async function ParticipantHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireParticipant(locale);
  const assessmentSummary = await getParticipantAssessmentSummary(
    actor.participantId,
  );
  const t = getDictionary(locale).home;
  const anonymous = actor.kind === "anonymous";
  const assessmentStatus = {
    not_started: t.notStarted,
    in_progress: t.inProgress,
    completed: t.completed,
  }[assessmentSummary.status];
  const securityRate = assessmentSummary.latestRisk
    ? {
        low: t.lowRisk,
        medium: t.mediumRisk,
        high: t.highRisk,
      }[assessmentSummary.latestRisk]
    : t.notRatedYet;
  const riskLabel = (risk: "low" | "medium" | "high") =>
    ({ low: t.lowRisk, medium: t.mediumRisk, high: t.highRisk })[risk];
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hebron",
  });
  const assessmentAction =
    assessmentSummary.status === "in_progress"
      ? t.resumeAssessment
      : assessmentSummary.status === "completed"
        ? t.retakeAssessment
        : t.startAssessment;

  return (
    <main id="main" className="participant-home">
      <div className="participant-dashboard">
        <Panel className="participant-hero-card">
          <div className="participant-heading">
            <div>
              <span className="session-status">
                <span aria-hidden="true" />
                {anonymous ? t.anonymousStatus : t.registeredStatus}
              </span>
              <h1>{t.welcome.replace("{name}", actor.displayName)}</h1>
              <p className="participant-intro">
                {anonymous ? t.anonymousIntro : t.registeredIntro}
              </p>
            </div>
          </div>

          <dl className="identity-list">
            <div>
              <dt>{t.assessmentStatus}</dt>
              <dd>{assessmentStatus}</dd>
            </div>
            <div>
              <dt>{t.attempts}</dt>
              <dd>
                {new Intl.NumberFormat(locale).format(
                  assessmentSummary.attemptCount,
                )}
              </dd>
            </div>
            <div>
              <dt>{t.securityRate}</dt>
              <dd
                className={`security-rate security-rate--${assessmentSummary.latestRisk ?? "unrated"}`}
              >
                {securityRate}
              </dd>
            </div>
          </dl>
        </Panel>

        <Panel className="assessment-entry-card">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h2>{t.assessmentTitle}</h2>
            <p>{t.assessmentDetails}</p>
            <div className="phase-notice">
              <Icon name="shield" />
              <p>{t.assessmentPending}</p>
            </div>
          </div>
          <Link
            className="button button-primary button-large"
            href={`/${locale}/assessment`}
          >
            {assessmentAction}
          </Link>
        </Panel>

        <div className="participant-support-grid">
          <Panel className="participant-empty-card result-history-card">
            <span className="section-icon" aria-hidden="true">
              <Icon name="chart" />
            </span>
            <div>
              <h2>{t.historyTitle}</h2>
              {assessmentSummary.history.length === 0 ? (
                <>
                  <span className="status-chip">{t.noHistory}</span>
                  <p>{anonymous ? t.historyAnonymous : t.historyRegistered}</p>
                </>
              ) : (
                <ol className="result-history-list">
                  {assessmentSummary.history.map((result, index) => (
                    <li key={result.attemptId}>
                      <div>
                        <strong>
                          {t.resultNumber.replace(
                            "{number}",
                            new Intl.NumberFormat(locale).format(
                              assessmentSummary.history.length - index,
                            ),
                          )}
                        </strong>
                        <span>{dateTime.format(result.completedAt)}</span>
                        <span
                          className={`risk-badge risk-badge--${result.risk}`}
                        >
                          {riskLabel(result.risk)} · {t.rawScoreShort}{" "}
                          <bdi dir="ltr">{result.totalScore}</bdi>
                        </span>
                      </div>
                      <Link
                        className="button button-secondary"
                        href={`/${locale}/results/${result.attemptId}`}
                      >
                        {t.viewResult}
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Panel>

          {anonymous && (
            <Panel
              as="aside"
              className="participant-empty-card session-limit-card"
            >
              <span className="section-icon" aria-hidden="true">
                <Icon name="alert" />
              </span>
              <div>
                <h2>{t.sessionLimitTitle}</h2>
                <p>{t.anonymousWarning}</p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </main>
  );
}
