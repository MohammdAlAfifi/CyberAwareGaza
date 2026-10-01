import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { getAdminCopy } from "@/src/admin/copy";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function ScenarioAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const t = getAdminCopy(locale);
  return (
    <AdminShell
      actorName={actor.displayName}
      intro={t.analyticsText}
      locale={locale}
      title={t.analyticsTitle}
    >
      <section className="panel admin-empty-state">
        <h2>{t.unavailable}</h2>
        <p>{t.analyticsText}</p>
      </section>
    </AdminShell>
  );
}
