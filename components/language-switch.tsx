"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

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
    <div className="language-switch" aria-label={t.languageToggle} role="group">
      {locale === "en" ? (
        <>
          <span aria-current="true">English</span>
          <button onClick={switchLanguage} type="button">
            العربية
          </button>
        </>
      ) : (
        <>
          <button onClick={switchLanguage} type="button">
            English
          </button>
          <span aria-current="true">العربية</span>
        </>
      )}
    </div>
  );
}
