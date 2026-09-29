import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AnonymousEntry } from "@/components/anonymous-entry";
import { SourceGate } from "@/components/source-gate";
import { Modal } from "@/components/ui/modal";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Anonymous session" };
export default async function AnonymousPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).auth;
  const modal = getDictionary(locale).modal;
  return (
    <main id="main" className="center-page auth-page">
      <section className="auth-card anonymous-card">
        <span className="large-symbol" aria-hidden="true">
          ◌
        </span>
        <h1>{t.anonTitle}</h1>
        <p className="auth-intro">{t.anonIntro}</p>
        <div className="warning-box">
          <strong>{t.warningTitle}</strong>
          <p>{t.warning}</p>
        </div>
        <AnonymousEntry locale={locale} />
        <Modal
          closeLabel={modal.close}
          eyebrow={modal.eyebrow}
          text={modal.text}
          title={modal.title}
          triggerLabel={modal.trigger}
        />
        <SourceGate locale={locale} />
      </section>
    </main>
  );
}
