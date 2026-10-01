import { notFound } from "next/navigation";
import { AdminPasswordForm } from "@/components/admin-password-form";
import { AdminShell } from "@/components/admin-shell";
import { getAdminCopy } from "@/src/admin/copy";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export default async function AdminSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ changed?: string }>;
}) {
  const { locale } = await params;
  const { changed } = await searchParams;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale, { allowPasswordChange: true });
  const t = getAdminCopy(locale);
  return (
    <AdminShell
      actorName={actor.displayName}
      intro={t.settingsIntro}
      locale={locale}
      title={t.settingsTitle}
    >
      <section className="panel admin-settings-card">
        {changed === "1" && (
          <p className="admin-success" role="status">
            {t.passwordChanged}
          </p>
        )}
        {actor.mustChangePassword && (
          <aside className="admin-required" role="alert">
            <strong>{t.passwordRequiredTitle}</strong>
            <p>{t.passwordRequiredText}</p>
          </aside>
        )}
        <AdminPasswordForm locale={locale} />
      </section>
    </AdminShell>
  );
}
