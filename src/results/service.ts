import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { ScenarioKey } from "@/src/assessment/content";
import { db } from "@/src/db";
import {
  accounts,
  assessmentAttempts,
  options,
  participants,
  responses,
  scenarios,
} from "@/src/db/schema";
import { getScoringRule } from "@/src/scoring/rubric";

export type ParticipantResult = {
  attemptId: string;
  participantCode: string;
  participantType: "registered" | "anonymous";
  displayName: string;
  completedAt: Date;
  totalScore: number;
  risk: "low" | "medium" | "high";
  responses: Array<{
    scenarioKey: ScenarioKey;
    order: number;
    question: { en: string; ar: string };
    selectedOptionId: string;
    selectedAnswer: { en: string; ar: string };
    contribution: number;
    explanation: { en: string; ar: string };
    guidance: { en: string; ar: string };
  }>;
};

/**
 * Returns only a completed result owned by the active participant. Keeping the
 * participant predicate in the database query prevents URL changes from
 * exposing another participant's result.
 */
export async function getParticipantResult(
  participantId: string,
  attemptId: string,
): Promise<ParticipantResult | null> {
  const [attempt] = await db
    .select({
      attemptId: assessmentAttempts.id,
      contentVersionId: assessmentAttempts.contentVersionId,
      participantCode: participants.publicCode,
      participantType: participants.type,
      anonymousOrdinal: participants.anonymousOrdinal,
      username: accounts.username,
      accountDisplayName: accounts.displayName,
      completedAt: assessmentAttempts.completedAt,
      totalScore: assessmentAttempts.totalScore,
      risk: assessmentAttempts.risk,
    })
    .from(assessmentAttempts)
    .innerJoin(
      participants,
      eq(participants.id, assessmentAttempts.participantId),
    )
    .leftJoin(accounts, eq(accounts.id, participants.accountId))
    .where(
      and(
        eq(assessmentAttempts.id, attemptId),
        eq(assessmentAttempts.participantId, participantId),
        eq(assessmentAttempts.status, "completed"),
      ),
    )
    .limit(1);

  if (
    !attempt?.contentVersionId ||
    !attempt.completedAt ||
    attempt.totalScore === null ||
    !attempt.risk ||
    (attempt.participantType !== "registered" &&
      attempt.participantType !== "anonymous")
  ) {
    return null;
  }

  const selectedResponses = await db
    .select({
      scenarioKey: responses.scenarioKey,
      order: scenarios.displayOrder,
      questionEn: scenarios.questionEn,
      questionAr: scenarios.questionAr,
      selectedOptionId: responses.selectedOptionId,
      selectedAnswerEn: options.textEn,
      selectedAnswerAr: options.textAr,
      contribution: responses.contribution,
    })
    .from(responses)
    .innerJoin(
      scenarios,
      and(
        eq(scenarios.contentVersionId, responses.contentVersionId),
        eq(scenarios.key, responses.scenarioKey),
      ),
    )
    .innerJoin(
      options,
      and(
        eq(options.contentVersionId, responses.contentVersionId),
        eq(options.scenarioKey, responses.scenarioKey),
        eq(options.id, responses.selectedOptionId),
      ),
    )
    .where(eq(responses.attemptId, attemptId))
    .orderBy(asc(scenarios.displayOrder));

  if (selectedResponses.length !== 8) return null;

  const reviewedResponses = selectedResponses.map((response) => {
    const scenarioKey = response.scenarioKey as ScenarioKey;
    const rule = getScoringRule(scenarioKey, response.selectedOptionId);
    if (!rule || rule.contribution !== response.contribution) {
      throw new Error(`Stored scoring trace is invalid for ${scenarioKey}`);
    }
    return {
      scenarioKey,
      order: response.order,
      question: { en: response.questionEn, ar: response.questionAr },
      selectedOptionId: response.selectedOptionId,
      selectedAnswer: {
        en: response.selectedAnswerEn,
        ar: response.selectedAnswerAr,
      },
      contribution: response.contribution,
      explanation: rule.explanation,
      guidance: rule.guidance,
    };
  });

  const displayName =
    attempt.participantType === "anonymous"
      ? `Anonymous ${attempt.anonymousOrdinal}`
      : attempt.accountDisplayName || attempt.username;
  if (!displayName) return null;

  return {
    attemptId: attempt.attemptId,
    participantCode: attempt.participantCode,
    participantType: attempt.participantType,
    displayName,
    completedAt: attempt.completedAt,
    totalScore: attempt.totalScore,
    risk: attempt.risk,
    responses: reviewedResponses,
  };
}
