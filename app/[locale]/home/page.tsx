import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { Panel } from "@/components/ui/panel";
import { requireParticipant } from "@/src/auth/authorization";
import { getDictionary, isLocale } from "@/src/i18n";
import { env } from "@/src/lib/env";

export const metadata: Metadata = { title: "Participant home" };

export default async function ParticipantHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireParticipant(locale);
  const t = getDictionary(locale).home;
  const anonymous = actor.kind === "anonymous";
  const expiresAt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: env.APP_TIMEZONE,
  }).format(actor.expiresAt);

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
            <LogoutButton locale={locale} />
          </div>

          <dl className="identity-list">
            <div>
              <dt>{t.participantId}</dt>
              <dd dir="ltr">{actor.publicCode}</dd>
            </div>
            <div>
              <dt>{t.sessionType}</dt>
              <dd>{anonymous ? t.anonymous : t.registered}</dd>
            </div>
            <div>
              <dt>{t.sessionExpiry}</dt>
              <dd>{expiresAt}</dd>
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
          <button
            aria-disabled="true"
            className="button button-primary button-large"
            disabled
            type="button"
          >
            {t.assessmentAction}
          </button>
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
