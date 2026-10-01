import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { Icon } from "@/components/icon";
import { Logo } from "@/components/logo";
import { getAdminCopy } from "@/src/admin/copy";
import { getCurrentSession } from "@/src/auth/sessions";
import { isLocale } from "@/src/i18n";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Administrator login" };

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await getCurrentSession();
  if (actor?.kind === "admin") {
    redirect(
      actor.mustChangePassword
        ? `/${locale}/admin/settings?required=1`
        : `/${locale}/admin`,
    );
  }
  const t = getAdminCopy(locale);
  return (
    <main id="main" className="admin-login-page">
      <section className="admin-login-brand">
        <Logo priority />
        <div className="admin-login-message">
          <span>
            <Icon name="shield" size={28} />
          </span>
          <p className="eyebrow">{t.portal}</p>
          <h1>{t.dashboardTitle}</h1>
          <p>{t.secure}</p>
        </div>
      </section>
      <div className="admin-login-form">
        <AuthCard locale={locale} mode="admin" />
      </div>
    </main>
  );
}
