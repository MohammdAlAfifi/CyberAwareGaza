import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icon } from "@/components/icon";
import { Panel } from "@/components/ui/panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Assessment shell preview" };

export default async function AssessmentPreviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).assessment;

  return (
    <main id="main" className="flow-page assessment-page">
      <div className="flow-width">
        <Link className="back-link" href={`/${locale}`}>
          <span className="mirrored-icon">
            <Icon name="arrow" size={18} />
          </span>
          {getDictionary(locale).common.back}
        </Link>

        <header className="flow-heading">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
          <p>{t.intro}</p>
        </header>

        <Panel className="assessment-card">
          <ProgressBar
            label={t.progressLabel}
            text={t.progressText}
            value={12.5}
          />

          <div className="question-block">
            <p className="question-label">{t.questionLabel}</p>
            <h2>{t.questionText}</h2>
          </div>

          <fieldset className="option-list" disabled>
            <legend className="sr-only">{t.questionLabel}</legend>
            {[1, 2, 3, 4].map((option) => (
              <label className="option-card" key={option}>
                <input name="preview-option" type="radio" />
                <span className="radio-mark" aria-hidden="true" />
                <span>{t.optionPlaceholder}</span>
              </label>
            ))}
          </fieldset>

          <p className="phase-note" role="note">
            <Icon name="shield" size={18} />
            {t.sourceNote}
          </p>

          <div className="assessment-actions">
            <button
              className="button button-secondary button-large"
              disabled
              type="button"
            >
              <span className="mirrored-icon">
                <Icon name="arrow" size={18} />
              </span>
              {t.previous}
            </button>
            <button
              className="button button-primary button-large"
              disabled
              type="button"
            >
              {t.next}
              <Icon name="arrow" size={18} />
            </button>
          </div>
        </Panel>
      </div>
    </main>
  );
}
