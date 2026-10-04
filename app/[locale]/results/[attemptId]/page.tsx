import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icon";
import { Panel } from "@/components/ui/panel";
import { requireParticipant } from "@/src/auth/authorization";
import { getDictionary, isLocale } from "@/src/i18n";
import { getParticipantResult } from "@/src/results/service";
import { classifyResponseRisk } from "@/src/scoring/risk";

export const metadata: Metadata = { title: "Assessment result" };

export default async function ParticipantResultPage({
  params,
}: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;
  if (!isLocale(locale)) notFound();

  const actor = await requireParticipant(locale);
  const result = await getParticipantResult(actor.participantId, attemptId);
  if (!result) notFound();

  const t = getDictionary(locale).result;
  const riskLabel = {
    low: t.lowRisk,
    medium: t.mediumRisk,
    high: t.highRisk,
  }[result.risk];
  const interpretation = {
    low: t.lowInterpretation,
    medium: t.mediumInterpretation,
    high: t.highInterpretation,
  }[result.risk];
  const dateTime = new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Hebron",
  }).format(result.completedAt);
  const displayPercentage = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(result.percentage);
  const visualPosition = result.percentage;

  return (
    <main id="main" className="result-page">
      <div className="page-width result-page-width">
        <Panel className="result-participant-ribbon">
          <div className="result-participant-identity">
            <span className="section-icon" aria-hidden="true">
              <Icon name="shield" />
            </span>
            <div>
              <h1>{result.displayName}</h1>
            </div>
          </div>
          <dl>
            <div>
              <dt>{t.submittedAt}</dt>
              <dd>{dateTime}</dd>
            </div>
            <div>
              <dt>{t.completion}</dt>
              <dd>{t.eightOfEight}</dd>
            </div>
          </dl>
          <div className="result-ribbon-actions">
            <Link
              className="button button-secondary"
              href={`/${locale}/assessment`}
            >
              <Icon name="refresh" size={18} />
              {t.retake}
            </Link>
            <Link className="button button-primary" href={`/${locale}/home`}>
              {t.returnHome}
            </Link>
          </div>
        </Panel>

        <Panel className="result-executive-card">
          <div className="result-title-row">
            <div>
              <p className="eyebrow">{t.eyebrow}</p>
              <h2>{t.title}</h2>
              <p>{t.subtitle}</p>
            </div>
            <span className={`risk-badge risk-badge--${result.risk}`}>
              {riskLabel}
            </span>
          </div>

          <div className="result-hero-grid">
            <div
              className="result-score-block"
              aria-label={`${displayPercentage}% ${locale === "ar" ? "نسبة القرارات الآمنة" : "safe-decision score percentage"}`}
            >
              <div className="score-ring">
                <svg aria-hidden="true" viewBox="0 0 160 160">
                  <circle
                    className="score-ring-track"
                    cx="80"
                    cy="80"
                    r="66"
                    pathLength="100"
                  />
                  <circle
                    className={`score-ring-value score-ring-value--${result.risk}`}
                    cx="80"
                    cy="80"
                    r="66"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={100 - visualPosition}
                  />
                </svg>
                <div className="score-ring-copy">
                  <strong dir="ltr">{displayPercentage}%</strong>
                  <span>Risk percentage</span>
                </div>
              </div>
              <p>
                {locale === "ar"
                  ? "تشير النسبة الأعلى إلى قرارات أكثر أمانًا في الأمن السيبراني."
                  : "A higher percentage indicates safer cybersecurity decisions."}
              </p>
              <small>
                {locale === "ar"
                  ? "نقاط القرار الآمن:"
                  : "Safe-decision points:"}{" "}
                <bdi dir="ltr">{result.totalScore}/80</bdi>
              </small>
            </div>

            <div className="result-summary-copy">
              <dl className="result-key-facts">
                <div>
                  <dt>
                    {locale === "ar" ? "نسبة المخاطر" : "Risk percentage"}
                  </dt>
                  <dd dir="ltr">{displayPercentage}%</dd>
                </div>
                <div>
                  <dt>{t.riskLabel}</dt>
                  <dd className={`risk-text risk-text--${result.risk}`}>
                    {riskLabel}
                  </dd>
                </div>
              </dl>
              <div className="result-interpretation">
                <span aria-hidden="true">
                  <Icon name="assessment" />
                </span>
                <div>
                  <h3>{t.interpretationTitle}</h3>
                  <p>{interpretation}</p>
                </div>
              </div>
              <p className="result-scale-note">
                {locale === "ar"
                  ? "لا يتم عكس النسبة؛ تشير القيمة الأعلى إلى قرارات أكثر أمانًا."
                  : "The percentage is not reversed; a higher value indicates safer decisions."}
              </p>
            </div>
          </div>
        </Panel>

        <section
          className="answer-review"
          aria-labelledby="answer-review-title"
        >
          <div className="answer-review-heading">
            <div>
              <p className="eyebrow">{t.feedbackTitle}</p>
              <h2 id="answer-review-title">{t.reviewTitle}</h2>
              <p>{t.reviewIntro}</p>
            </div>
            <span className="status-chip">{t.eightScenarios}</span>
          </div>

          <div className="answer-review-list">
            {result.responses.map((response) => (
              <article
                className="answer-review-card"
                key={response.scenarioKey}
              >
                <header>
                  <span className="scenario-number" aria-hidden="true">
                    {new Intl.NumberFormat(locale).format(response.order)}
                  </span>
                  <div>
                    <p className="scenario-kicker">
                      {t.scenario.replace(
                        "{number}",
                        new Intl.NumberFormat(locale).format(response.order),
                      )}
                    </p>
                    <h3>{response.question[locale]}</h3>
                  </div>
                  <span
                    className={`score-delta score-delta--${classifyResponseRisk(response.contribution)}`}
                    dir="ltr"
                  >
                    {new Intl.NumberFormat(locale, {
                      signDisplay: "always",
                    }).format(response.contribution)}
                    {" · "}
                    {
                      {
                        low: t.lowRisk,
                        medium: t.mediumRisk,
                        high: t.highRisk,
                      }[classifyResponseRisk(response.contribution)]
                    }
                  </span>
                </header>
                <div className="answer-review-grid">
                  <div className="selected-answer-box">
                    <span>{t.selectedAnswer}</span>
                    {response.scenarioKey === "S4" ? (
                      <strong>
                        <bdi dir="ltr">{response.selectedAnswer[locale]}</bdi>
                      </strong>
                    ) : (
                      <strong>{response.selectedAnswer[locale]}</strong>
                    )}
                    <small>{t.scoreContribution}</small>
                  </div>
                  <div className="explanation-box">
                    <span>{t.whyItMatters}</span>
                    <p>{response.explanation[locale]}</p>
                  </div>
                  <div className="guidance-box">
                    <span>
                      <Icon name="shield" size={18} /> {t.saferAction}
                    </span>
                    <p>{response.guidance[locale]}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
