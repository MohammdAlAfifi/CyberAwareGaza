import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceGate } from "@/components/source-gate";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Cybersecurity awareness assessment" };

export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <main id="main">
      <section className="hero" id="about">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">●</span> {t.landing.eyebrow}</p>
          <h1>{t.landing.title}</h1>
          <p className="lede">{t.landing.intro}</p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href={`/${locale}/start`}>
              {t.nav.start} <span aria-hidden="true">{locale === "ar" ? "←" : "→"}</span>
            </Link>
            <a className="button button-ghost button-large" href="#how">{t.nav.how}</a>
          </div>
          <p className="privacy-note"><span aria-hidden="true">◇</span> {t.landing.privacy}</p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="signal-card signal-a"><b>01</b><span>••••</span></div>
          <div className="signal-card signal-b"><b>08</b><span>••••••</span></div>
          <div className="shield-mark"><span>8</span><small>scenarios</small></div>
        </div>
      </section>

      <div className="page-width"><SourceGate locale={locale} /></div>

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
    </main>
  );
}
