import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminDashboardView } from "@/components/admin-dashboard";
import { parseAnalyticsSource } from "@/src/admin/analytics";
import { getAnalyticsDashboard } from "@/src/admin/analytics-service";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Admin dashboard" };

export default async function AdminDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  const source = parseAnalyticsSource((await searchParams).source);
  const data = await getAnalyticsDashboard(actor, source);
  return (
    <AdminDashboardView
      actorName={actor.displayName}
      data={data}
      locale={locale}
    />
  );
}
