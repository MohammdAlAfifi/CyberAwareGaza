import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SourceGate } from "@/components/source-gate";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Anonymous session" };
export default async function AnonymousPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).auth;
  return (
    <main id="main" className="center-page auth-page">
      <section className="auth-card anonymous-card">
        <span className="large-symbol" aria-hidden="true">◌</span>
        <h1>{t.anonTitle}</h1>
        <p className="auth-intro">{t.anonIntro}</p>
        <div className="warning-box"><strong>{t.warningTitle}</strong><p>{t.warning}</p></div>
        <button className="button button-primary button-large full" type="button" disabled>{t.acknowledge}</button>
        <SourceGate locale={locale} />
      </section>
    </main>
  );
}
