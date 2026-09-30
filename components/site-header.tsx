import Link from "next/link";
import { HeaderLogoLink } from "@/components/header-logo-link";
import { Icon } from "@/components/icon";
import { LanguageSwitch } from "@/components/language-switch";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentSession } from "@/src/auth/sessions";
import { getDictionary, type Locale } from "@/src/i18n";

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = getDictionary(locale);
  const actor = await getCurrentSession();
  const participantActive =
    actor?.kind === "registered" || actor?.kind === "anonymous";
  const assessmentHref = participantActive
    ? `/${locale}/home`
    : `/${locale}/start`;

  return (
    <header className="site-header">
      <div className="header-inner">
        <HeaderLogoLink locale={locale} />
        <nav className="primary-nav" aria-label={t.common.primaryNavigation}>
          <Link href={`/${locale}#about`}>{t.nav.about}</Link>
          <Link href={`/${locale}#how`}>{t.nav.how}</Link>
        </nav>
        <div className="header-actions">
          <LanguageSwitch locale={locale} />
          {participantActive ? (
            <LogoutButton
              className="button button-ghost desktop-action"
              locale={locale}
            />
          ) : (
            <Link
              className="button button-ghost desktop-action"
              href={`/${locale}/start`}
            >
              {t.nav.login}
            </Link>
          )}
          <Link
            className="icon-button participant-button"
            href={assessmentHref}
            aria-label={
              participantActive
                ? t.nav.participantDashboard
                : t.nav.participantAccess
            }
            title={
              participantActive
                ? t.nav.participantDashboard
                : t.nav.participantAccess
            }
          >
            <Icon name="user" size={21} />
          </Link>
          <details className="mobile-menu">
            <summary className="icon-button" aria-label={t.common.menu}>
              <Icon name="menu" />
            </summary>
            <nav aria-label={t.common.menu} className="mobile-menu-panel">
              <Link href={`/${locale}#about`}>{t.nav.about}</Link>
              <Link href={`/${locale}#how`}>{t.nav.how}</Link>
              {participantActive ? (
                <LogoutButton className="mobile-menu-action" locale={locale} />
              ) : (
                <Link href={`/${locale}/start`}>{t.nav.login}</Link>
              )}
              <Link href={assessmentHref}>
                {participantActive
                  ? t.nav.participantDashboard
                  : t.nav.participantAccess}
              </Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
