import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon, type IconName } from "@/components/icon";
import { getCurrentSession } from "@/src/auth/sessions";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Start assessment" };

export default async function StartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await getCurrentSession();
  if (actor?.kind === "registered" || actor?.kind === "anonymous") {
    redirect(`/${locale}/home`);
  }
  const t = getDictionary(locale).start;
  const cards: ReadonlyArray<readonly [IconName, string, string, string]> = [
    ["login", t.loginTitle, t.loginText, `/${locale}/login`],
    ["user", t.signupTitle, t.signupText, `/${locale}/signup`],
    ["shield", t.anonTitle, t.anonText, `/${locale}/anonymous`],
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
                <Icon name={icon} size={25} />
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
