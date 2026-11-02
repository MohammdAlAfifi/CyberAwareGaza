import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminFeedbackView } from "@/components/admin-feedback";
import {
  getFeedbackAnalytics,
  type FeedbackAnalytics,
} from "@/src/admin/feedback-analytics";
import { requireAdmin } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Usability Feedback" };

export default async function AdminFeedbackPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireAdmin(locale);
  let data: FeedbackAnalytics | null = null;
  try {
    data = await getFeedbackAnalytics(actor);
  } catch {
    /* Render a localized error, never a false zero. */
  }
  return (
    <AdminFeedbackView
      actorName={actor.displayName}
      locale={locale}
      data={data}
    />
  );
}
