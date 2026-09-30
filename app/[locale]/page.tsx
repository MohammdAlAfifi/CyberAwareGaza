import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { getCurrentSession } from "@/src/auth/sessions";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = {
  title: "Cybersecurity awareness assessment",
};

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  const actor = await getCurrentSession();
  const participantActive =
    actor?.kind === "registered" || actor?.kind === "anonymous";
  const assessmentHref = participantActive
    ? `/${locale}/home`
    : `/${locale}/start`;
  const highlightIcons: readonly IconName[] = [
    "assessment",
    "clock",
    "chart",
    "shield",
  ];

  return (
    <main id="main">
      <section className="hero" id="about">
        <div className="hero-copy">
          <p className="eyebrow">
            <span aria-hidden="true">●</span> {t.landing.eyebrow}
          </p>
          <h1>{t.landing.title}</h1>
          <p className="lede">{t.landing.intro}</p>
          <div className="hero-actions">
            <Link
              className="button button-primary button-large"
              href={assessmentHref}
            >
              {t.nav.start}{" "}
              <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
            </Link>
            <a className="button button-ghost button-large" href="#how">
              {t.nav.how}
            </a>
          </div>
          <p className="privacy-note">
            <span aria-hidden="true">◇</span> {t.landing.privacy}
          </p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="signal-card signal-a">
            <b>01</b>
            <span>••••</span>
          </div>
          <div className="signal-card signal-b">
            <b>08</b>
            <span>••••••</span>
          </div>
          <div className="shield-mark">
            <span>8</span>
            <small>{t.landing.scenarioLabel}</small>
          </div>
        </div>
      </section>

      <section
        className="highlight-section page-width"
        aria-label={t.landing.highlightsLabel}
      >
        <div className="highlight-grid">
          {t.landing.highlights.map((highlight, index) => (
            <article className="highlight-card" key={highlight.title}>
              <div className="highlight-card-top">
                <span className="highlight-icon" aria-hidden="true">
                  <Icon name={highlightIcons[index]} size={22} />
                </span>
                <span className="highlight-badge">{highlight.badge}</span>
              </div>
              <h2>{highlight.title}</h2>
              <p>{highlight.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="how-section" id="how">
        <div className="section-heading">
          <p className="eyebrow">01 — 08</p>
          <h2>{t.landing.overview}</h2>
          <p>{t.landing.overviewText}</p>
        </div>
        <ol className="step-grid">
          {t.landing.steps.map(([title, text], index) => (
            <li key={title}>
              <span className="step-number">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="research-band">
        <div>
          <p className="eyebrow">CyberAwareGaza</p>
          <h2>{t.landing.research}</h2>
        </div>
        <p>{t.landing.researchText}</p>
      </section>

      <section
        className="shell-preview page-width"
        aria-labelledby="shells-title"
      >
        <div className="section-heading">
          <p className="eyebrow">{t.common.preview}</p>
          <h2 id="shells-title">{t.landing.shellsTitle}</h2>
          <p>{t.landing.shellsText}</p>
        </div>
        <div className="shell-link-grid">
          <Link className="shell-link" href={`/${locale}/assessment/preview`}>
            <span className="shell-link-icon" aria-hidden="true">
              01
            </span>
            <strong>{t.nav.assessmentPreview}</strong>
            <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
          </Link>
          <Link className="shell-link" href={`/${locale}/results/preview`}>
            <span className="shell-link-icon" aria-hidden="true">
              —
            </span>
            <strong>{t.nav.resultPreview}</strong>
            <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
          </Link>
          <Link className="shell-link" href={`/${locale}/admin`}>
            <span className="shell-link-icon" aria-hidden="true">
              ◇
            </span>
            <strong>{t.nav.adminPreview}</strong>
            <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
