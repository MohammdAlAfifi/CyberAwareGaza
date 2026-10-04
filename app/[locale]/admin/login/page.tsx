import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  redirect(`/${locale}/login`);
}
