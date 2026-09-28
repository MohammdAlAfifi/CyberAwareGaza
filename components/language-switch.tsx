"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { Icon } from "@/components/icon";
import { getDictionary, type Locale } from "@/src/i18n";

const LOCALE_COOKIE_AGE = 60 * 60 * 24 * 30;

export function LanguageSwitch({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();
  const otherLocale: Locale = locale === "en" ? "ar" : "en";
  const t = getDictionary(locale);

  useEffect(() => {
    sessionStorage.setItem("cyberaware-locale", locale);
    document.cookie = `cyberaware_locale=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_AGE}; SameSite=Lax`;
  }, [locale]);

  function switchLanguage() {
    sessionStorage.setItem("cyberaware-locale", otherLocale);
    document.cookie = `cyberaware_locale=${otherLocale}; Path=/; Max-Age=${LOCALE_COOKIE_AGE}; SameSite=Lax`;

    const url = new URL(window.location.href);
    url.pathname = pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${otherLocale}`);
    router.push(`${url.pathname}${url.search}${url.hash}`);
  }

  return (
    <button
      aria-label={t.languageAria}
      className="language-switch"
      onClick={switchLanguage}
      type="button"
    >
      <Icon name="globe" size={18} />
      <span>{t.language}</span>
    </button>
  );
}
