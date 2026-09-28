"use client";

import Link from "next/link";
import { useRef } from "react";

import { Icon, type IconName } from "@/components/icon";
import { LanguageSwitch } from "@/components/language-switch";
import { Logo } from "@/components/logo";
import { getDictionary, type Locale } from "@/src/i18n";

function NavigationLinks({
  items,
  locale,
}: {
  items: ReadonlyArray<readonly [IconName, string, string]>;
  locale: Locale;
}) {
  return (
    <nav
      aria-label={getDictionary(locale).admin.brandLabel}
      className="admin-nav"
    >
      {items.map(([icon, label, href], index) => (
        <Link className={index === 0 ? "active" : ""} href={href} key={label}>
          <Icon name={icon} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AdminNavigation({ locale }: { locale: Locale }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const t = getDictionary(locale).admin;
  const items: ReadonlyArray<readonly [IconName, string, string]> = [
    ["home", t.overview, `/${locale}/admin`],
    ["users", t.participants, `/${locale}/admin#participants`],
    ["assessment", t.assessments, `/${locale}/admin#assessments`],
    ["chart", t.scenarios, `/${locale}/admin#scenarios`],
    ["upload", t.imports, `/${locale}/admin#imports`],
    ["settings", t.settings, `/${locale}/admin#settings`],
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

      <dialog className="admin-drawer" ref={dialogRef}>
        <div className="drawer-head">
          <strong>{t.brandLabel}</strong>
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
      </dialog>
    </>
  );
}
