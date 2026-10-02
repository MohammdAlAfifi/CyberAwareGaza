import type { ReactNode } from "react";

import { AdminNavigation } from "@/components/admin-navigation";
import { LanguageSwitch } from "@/components/language-switch";
import { getAdminCopy } from "@/src/admin/copy";
import type { Locale } from "@/src/i18n";

export function AdminShell({
  children,
  intro,
  locale,
  title,
}: {
  actorName: string;
  children: ReactNode;
  intro: string;
  locale: Locale;
  title: string;
}) {
  const t = getAdminCopy(locale);
  return (
    <main id="main" className="admin-shell">
      <AdminNavigation locale={locale} />
      <section className="admin-content">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">{t.portal}</p>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
          <div className="admin-heading-language">
            <LanguageSwitch locale={locale} />
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
