import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthCard } from "@/components/auth-card";
import { isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Create account" };
export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <main id="main" className="center-page auth-page">
      <AuthCard locale={locale} mode="signup" />
    </main>
  );
}
