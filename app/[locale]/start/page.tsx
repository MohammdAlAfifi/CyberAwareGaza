import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Start assessment" };

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale).start;
  const cards = [
    ["⌁", t.loginTitle, t.loginText, `/${locale}/login`],
    ["＋", t.signupTitle, t.signupText, `/${locale}/signup`],
    ["◌", t.anonTitle, t.anonText, `/${locale}/anonymous`],
  ];

  return (
    <main id="main" className="center-page">
      <section className="entry-panel">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p className="lede compact">{t.intro}</p>
        <div className="entry-grid">
          {cards.map(([icon, title, text, href]) => (
            <Link className="entry-card" href={href} key={title}>
              <span className="entry-icon" aria-hidden="true">
                {icon}
              </span>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
              <span className="entry-arrow" aria-hidden="true">
                {locale === "ar" ? "←" : "→"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
