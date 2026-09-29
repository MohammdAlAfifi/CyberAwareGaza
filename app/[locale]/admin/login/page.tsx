import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Administrator login" };

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main" className="center-page auth-page">
      <AuthCard locale={locale} mode="admin" />
    </main>
  );
}
