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
          <Panel className="participant-empty-card">
            <span className="section-icon" aria-hidden="true">
              <Icon name="chart" />
            </span>
            <div>
              <h2>{t.historyTitle}</h2>
              <span className="status-chip">{t.noHistory}</span>
              <p>{anonymous ? t.historyAnonymous : t.historyRegistered}</p>
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
