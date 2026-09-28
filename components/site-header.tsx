import Link from "next/link";
import { Logo } from "@/components/logo";
import { getDictionary, type Locale } from "@/src/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const other = locale === "en" ? "ar" : "en";

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link
          className="logo-link"
          href={`/${locale}`}
          aria-label="CyberAwareGaza home"
        >
          <Logo priority />
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href={`/${locale}#about`}>{t.nav.about}</Link>
          <Link href={`/${locale}#how`}>{t.nav.how}</Link>
        </nav>
        <div className="header-actions">
          <Link className="language-link" href={`/${other}`} hrefLang={other}>
            <span aria-hidden="true">◎</span> {t.language}
          </Link>
          <Link
            className="button button-ghost desktop-action"
            href={`/${locale}/login`}
          >
            {t.nav.login}
          </Link>
          <Link className="button button-primary" href={`/${locale}/start`}>
            {t.nav.start}
          </Link>
        </div>
      </div>
    </header>
  );
}
