import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { RiskBadge, StatusBadge } from "@/components/admin-records";
import { getAdminCopy } from "@/src/admin/copy";
import { formatAdminDate } from "@/src/admin/format";
import { getAssessmentDetails } from "@/src/admin/service";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function AssessmentDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const data = await getAssessmentDetails(actor, attemptId);
  if (!data) notFound();
  const t = getAdminCopy(locale);
  const a = data.attempt;
  return (
    <AdminShell
      actorName={actor.displayName}
      intro={`${a.displayName} · ${a.publicCode}`}
      locale={locale}
      title={t.assessmentDetails}
    >
      <section className="panel admin-detail-card">
        <dl className="admin-facts">
          <div>
            <dt>{t.participant}</dt>
            <dd>
              <Link
                className="table-link"
                href={`/${locale}/admin/participants/${a.participantId}`}
              >
                {a.displayName}
              </Link>
            </dd>
          </div>
          <div>
            <dt>{t.participantId}</dt>
            <dd>
              <bdi dir="ltr">{a.publicCode}</bdi>
            </dd>
          </div>
          <div>
            <dt>{t.attemptId}</dt>
            <dd>
              <bdi dir="ltr">{a.id}</bdi>
            </dd>
          </div>
          <div>
            <dt>{t.source}</dt>
            <dd>
              <span className={`source-label source-label--${a.source}`}>
                {a.source === "web" ? t.website : t.googleForm}
              </span>
            </dd>
          </div>
          <div>
            <dt>{t.status}</dt>
            <dd>
              <StatusBadge locale={locale} status={a.status} />
            </dd>
          </div>
          <div>
            <dt>{t.finalScore}</dt>
            <dd>{a.totalScore ?? "—"}</dd>
          </div>
          <div>
            <dt>{t.risk}</dt>
            <dd>
              <RiskBadge locale={locale} risk={a.risk} />
            </dd>
          </div>
          <div>
            <dt>{t.completedAt}</dt>
            <dd>{formatAdminDate(a.completedAt, locale)}</dd>
          </div>
        </dl>
        {a.status !== "completed" && (
          <p className="admin-notice">{t.incompleteNotice}</p>
        )}
      </section>
      <section className="admin-answer-section">
        <h2>{t.selectedResponses}</h2>
        {data.answers.length === 0 ? (
          <p className="panel admin-empty">{t.noSavedResponses}</p>
        ) : (
          <div className="admin-answer-list">
            {data.answers.map((answer) => (
              <article
                className="panel admin-answer-card"
                key={answer.scenarioKey}
              >
                <header>
                  <span>
                    {t.scenario.replace("{number}", String(answer.order))}
                  </span>
                  {answer.contribution === null ? (
                    <span className="admin-muted">—</span>
                  ) : (
                    <strong
                      className={`score-delta ${answer.contribution >= 0 ? "score-delta--positive" : "score-delta--negative"}`}
                    >
                      {answer.contribution > 0 ? "+" : ""}
                      {answer.contribution}
                    </strong>
                  )}
                </header>
                <h3>
                  {locale === "ar" ? answer.questionAr : answer.questionEn}
                </h3>
                <div>
                  <span>{t.selectedAnswer}</span>
                  <p>{locale === "ar" ? answer.answerAr : answer.answerEn}</p>
                  <small>
                    <bdi dir="ltr">{answer.optionId}</bdi>
                  </small>
                </div>
                <footer>
                  <span>{t.scoreDelta}</span>
                  <strong>{answer.contribution ?? "—"}</strong>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
