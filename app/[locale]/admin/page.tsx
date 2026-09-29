import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminNavigation } from "@/components/admin-navigation";
import { Icon } from "@/components/icon";
import { Panel } from "@/components/ui/panel";
import { StatePanel } from "@/components/ui/state-panel";
import { getDictionary, isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Admin dashboard shell preview" };

export default async function AdminPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { locale } = await params;
  const { state } = await searchParams;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const t = dictionary.admin;
  const shellState = state === "loading" || state === "error" ? state : "empty";

  return (
    <main id="main" className="admin-shell">
      <AdminNavigation locale={locale} />
      <section className="admin-content">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">{dictionary.common.preview}</p>
            <h1>{t.dashboard}</h1>
            <p>{t.dashboardIntro}</p>
          </div>
          <span className="status-chip status-preview">
            {dictionary.common.preview}
          </span>
        </header>

        <nav
          aria-label={dictionary.common.preview}
          className="state-switcher admin-state-switcher"
        >
          <Link
            aria-current={shellState === "loading" ? "page" : undefined}
            href={`/${locale}/admin?state=loading`}
          >
            {t.viewLoading}
          </Link>
          <Link
            aria-current={shellState === "empty" ? "page" : undefined}
            href={`/${locale}/admin`}
          >
            {t.viewEmpty}
          </Link>
          <Link
            aria-current={shellState === "error" ? "page" : undefined}
            href={`/${locale}/admin?state=error`}
          >
            {t.viewError}
          </Link>
        </nav>

        <aside className="preview-banner" role="note">
          <Icon name="shield" />
          <div>
            <strong>{t.previewNotice}</strong>
            <p>{t.previewText}</p>
          </div>
        </aside>

        {shellState === "loading" ? (
          <StatePanel
            text={dictionary.states.loadingText}
            title={dictionary.states.loadingTitle}
            type="loading"
          />
        ) : shellState === "error" ? (
          <StatePanel
            action={dictionary.common.retry}
            text={dictionary.states.errorText}
            title={dictionary.states.errorTitle}
            type="error"
          />
        ) : (
          <>
            <section aria-label={t.dashboard} className="metric-grid">
              {t.kpis.map((label, index) => (
                <Panel as="article" className="metric-card" key={label}>
                  <span className="metric-icon" aria-hidden="true">
                    <Icon
                      name={
                        index === 0
                          ? "users"
                          : index === 1
                            ? "assessment"
                            : "chart"
                      }
                    />
                  </span>
                  <p>{label}</p>
                  <strong aria-label={t.notAvailable}>—</strong>
                  <small>{t.notAvailable}</small>
                </Panel>
              ))}
            </section>

            <Panel className="admin-table-shell">
              <div className="table-heading">
                <div>
                  <p className="eyebrow">{dictionary.common.empty}</p>
                  <h2>{t.recentTitle}</h2>
                </div>
                <span className="status-chip">0</span>
              </div>
              <StatePanel
                text={t.recentText}
                title={dictionary.states.emptyTitle}
                type="empty"
              />
              <p className="file-hint">
                <Icon name="upload" size={18} />
                <span>{t.fileHint.split("responses.csv")[0]}</span>
                <bdi dir="ltr">responses.csv</bdi>
                <span>{t.fileHint.split("responses.csv")[1]}</span>
              </p>
            </Panel>
          </>
        )}
      </section>
    </main>
  );
}
