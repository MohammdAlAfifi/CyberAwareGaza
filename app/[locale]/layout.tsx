import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/noto-sans-arabic/arabic-400.css";
import "@fontsource/noto-sans-arabic/arabic-600.css";
import "@fontsource/noto-sans-arabic/arabic-700.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, isLocale, locales } from "@/src/i18n";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: "CyberAwareGaza", template: "%s | CyberAwareGaza" },
  description:
    "Bilingual cybersecurity awareness and risk assessment for academic institutions in Gaza.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);

  return (
    <html
      data-scroll-behavior="smooth"
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <body>
        <a className="skip-link" href="#main">
          {t.skip}
        </a>
        <SiteHeader locale={locale} />
        {children}
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
