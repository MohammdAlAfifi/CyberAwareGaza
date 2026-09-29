import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icon";
import { LogoutButton } from "@/components/logout-button";
import { Panel } from "@/components/ui/panel";
import { requireParticipant } from "@/src/auth/authorization";
import { getDictionary, isLocale } from "@/src/i18n";

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

  return (
    <main id="main" className="center-page participant-home">
      <Panel className="participant-card">
        <div className="participant-heading">
          <div>
            <p className="eyebrow">{t.eyebrow}</p>
            <h1>{t.welcome.replace("{name}", actor.displayName)}</h1>
            <p>{t.intro}</p>
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
            <dd>{actor.kind === "anonymous" ? t.anonymous : t.registered}</dd>
          </div>
        </dl>

        {actor.kind === "anonymous" && (
          <aside className="warning-box" role="note">
            <strong>{t.anonymousWarningTitle}</strong>
            <p>{t.anonymousWarning}</p>
          </aside>
        )}

        <div className="phase-notice">
          <Icon name="shield" />
          <div>
            <strong>{t.assessmentTitle}</strong>
            <p>{t.assessmentPending}</p>
          </div>
        </div>
      </Panel>
    </main>
  );
}
