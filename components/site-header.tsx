import Link from "next/link";
import { Icon } from "@/components/icon";
import { LanguageSwitch } from "@/components/language-switch";
import { Logo } from "@/components/logo";
import { getDictionary, type Locale } from "@/src/i18n";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);

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
          <LanguageSwitch locale={locale} />
          <Link
            className="button button-ghost desktop-action"
            href={`/${locale}/login`}
          >
            {t.nav.login}
          </Link>
          <Link className="button button-primary" href={`/${locale}/start`}>
            {t.nav.start}
          </Link>
          <details className="mobile-menu">
            <summary className="icon-button" aria-label={t.common.menu}>
              <Icon name="menu" />
            </summary>
            <nav aria-label={t.common.menu} className="mobile-menu-panel">
              <Link href={`/${locale}#about`}>{t.nav.about}</Link>
              <Link href={`/${locale}#how`}>{t.nav.how}</Link>
              <Link href={`/${locale}/login`}>{t.nav.login}</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
