"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { Icon, type IconName } from "@/components/icon";
import { LanguageSwitch } from "@/components/language-switch";
import { Logo } from "@/components/logo";
import { LogoutButton } from "@/components/logout-button";
import { getDictionary, type Locale } from "@/src/i18n";
import { getAdminCopy } from "@/src/admin/copy";

function NavigationLinks({
  items,
  locale,
}: {
  items: ReadonlyArray<readonly [IconName, string, string]>;
  locale: Locale;
}) {
  const pathname = usePathname();
  return (
    <nav
      aria-label={getDictionary(locale).admin.brandLabel}
      className="admin-nav"
    >
      {items.map(([icon, label, href]) => {
        const active =
          pathname === href ||
          (href !== `/${locale}/admin` && pathname.startsWith(`${href}/`));
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "active" : ""}
            href={href}
            key={label}
          >
            <Icon name={icon} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminNavigation({ locale }: { locale: Locale }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = getDictionary(locale).admin;
  const admin = getAdminCopy(locale);
  const items: ReadonlyArray<readonly [IconName, string, string]> = [
    ["home", admin.dashboard, `/${locale}/admin`],
    ["users", admin.participants, `/${locale}/admin/participants`],
    ["assessment", admin.assessments, `/${locale}/admin/assessments`],
    ["chart", admin.analytics, `/${locale}/admin/scenario-analytics`],
    ["upload", admin.importExport, `/${locale}/admin/import-export`],
    ["settings", admin.settings, `/${locale}/admin/settings`],
  ];

  return (
    <>
      <aside className="admin-sidebar">
        <Link
          aria-label="CyberAwareGaza"
          className="admin-logo"
          href={`/${locale}`}
        >
          <Logo priority />
        </Link>
        <p>{t.brandLabel}</p>
        <NavigationLinks items={items} locale={locale} />
        <LanguageSwitch locale={locale} />
        <LogoutButton label={admin.logout} locale={locale} />
      </aside>

      <div className="admin-mobile-bar">
        <Link
          aria-label="CyberAwareGaza"
          className="admin-mobile-logo"
          href={`/${locale}`}
        >
          <Logo priority />
        </Link>
        <button
          aria-label={t.openMenu}
          className="icon-button"
          onClick={() => dialogRef.current?.showModal()}
          type="button"
        >
          <Icon name="menu" />
        </button>
      </div>

      <dialog
        aria-labelledby="admin-drawer-title"
        className="admin-drawer"
        ref={dialogRef}
      >
        <div className="drawer-head">
          <strong id="admin-drawer-title">{t.brandLabel}</strong>
          <button
            aria-label={t.closeMenu}
            className="icon-button"
            onClick={() => dialogRef.current?.close()}
            type="button"
          >
            <Icon name="close" />
          </button>
        </div>
        <NavigationLinks items={items} locale={locale} />
        <LanguageSwitch locale={locale} />
        <LogoutButton label={admin.logout} locale={locale} />
      </dialog>
    </>
  );
}
