import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AssessmentFlow } from "@/components/assessment-flow";
import { requireParticipant } from "@/src/auth/authorization";
import { getAssessmentJourney } from "@/src/assessment/service";
import { isLocale } from "@/src/i18n";

export const metadata: Metadata = { title: "Cybersecurity assessment" };

export default async function AssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ scenario?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const actor = await requireParticipant(locale);
  const journey = await getAssessmentJourney(actor.participantId);
  const requestedScenario = Number((await searchParams).scenario);
  const initialScenario =
    journey.attemptId &&
    Number.isInteger(requestedScenario) &&
    requestedScenario >= 1 &&
    requestedScenario <= 8
      ? requestedScenario
      : null;

  return (
    <main id="main" className="flow-page assessment-page">
      <div className="flow-width">
        <AssessmentFlow
          initialAnswers={journey.answers}
          initialAttemptId={journey.attemptId}
          initialScenario={initialScenario}
          locale={locale}
        />
      </div>
    </main>
  );
}
