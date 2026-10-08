import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssessmentCompletion } from "@/components/assessment-completion";
import { ownsCompletedAssessment } from "@/src/assessment/service";
import { requireParticipant } from "@/src/auth/authorization";
import { isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Assessment completed" };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AssessmentCompletedPage({
  params,
}: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;
  if (!isLocale(locale) || !UUID.test(attemptId)) notFound();

  const actor = await requireParticipant(locale);
  if (!(await ownsCompletedAssessment(actor.participantId, attemptId))) {
    notFound();
  }

  return (
    <main id="main" className="flow-page assessment-page">
      <div className="flow-width">
        <AssessmentCompletion locale={locale} />
      </div>
    </main>
  );
}
