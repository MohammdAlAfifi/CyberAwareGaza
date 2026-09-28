import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icon";
import { Panel } from "@/components/ui/panel";
import { StatePanel } from "@/components/ui/state-panel";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Result shell preview" };

export default async function ResultPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale } = await params;
  const { state } = await searchParams;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const t = dictionary.result;
  const shellState = state === "loading" || state === "error" ? state : "empty";

  return (
    <main id="main" className="flow-page result-page">
      <div className="flow-width result-width">
        <header className="flow-heading centered-heading">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <span className="status-chip status-preview">{t.previewBadge}</span>
        </header>

        <nav aria-label={dictionary.common.preview} className="state-switcher">
          <Link href={`/${locale}/results/preview?state=loading`}>
            {dictionary.common.loading}
          </Link>
          <Link href={`/${locale}/results/preview`}>
            {dictionary.common.empty}
          </Link>
          <Link href={`/${locale}/results/preview?state=error`}>
            {dictionary.common.error}
          </Link>
        </nav>

        {shellState === "loading" ? (
          <StatePanel
            text={dictionary.states.loadingText}
            title={dictionary.states.loadingTitle}
            type="loading"
          />
        ) : shellState === "error" ? (
          <StatePanel
            action={dictionary.common.retry}
            text={dictionary.states.errorText}
            title={dictionary.states.errorTitle}
            type="error"
          />
        ) : (
          <>
            <Panel className="result-summary">
              <div className="empty-result-ring" aria-hidden="true">
                <Icon name="shield" size={36} />
              </div>
              <div className="result-copy">
                <h2>{t.emptyTitle}</h2>
                <p>{t.emptyText}</p>
                <dl className="result-facts">
                  <div>
                    <dt>{t.scoreLabel}</dt>
                    <dd aria-label={t.unavailable}>—</dd>
                  </div>
                  <div>
                    <dt>{t.riskLabel}</dt>
                    <dd>{t.unavailable}</dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <div className="result-grid">
              <Panel>
                <span className="section-icon" aria-hidden="true">
                  <Icon name="shield" />
                </span>
                <h2>{t.feedbackTitle}</h2>
                <p>{t.feedbackText}</p>
              </Panel>
              <Panel>
                <span className="section-icon" aria-hidden="true">
                  <Icon name="assessment" />
                </span>
                <h2>{t.reviewTitle}</h2>
                <p>{t.reviewText}</p>
              </Panel>
            </div>
          </>
        )}

        <Link
          className="button button-primary button-large result-cta"
          href={`/${locale}/start`}
        >
          {t.start}
        </Link>
      </div>
    </main>
  );
}
