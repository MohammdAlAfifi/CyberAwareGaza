import "server-only";

import { and, asc, desc, eq, sql } from "drizzle-orm";

import {
  ASSESSMENT_CONTENT_VERSION,
  CONSENT_VERSION,
  type ScenarioKey,
} from "@/src/assessment/content";
import { AssessmentError } from "@/src/assessment/errors";
import {
  consentAllowsAssessment,
  hasCompleteAnswerSet,
} from "@/src/assessment/rules";
import { db } from "@/src/db";
import {
  assessmentAttempts,
  assessmentDraftAnswers,
  consents,
  contentVersions,
  options,
  responses,
  rubricEntries,
  rubricVersions,
} from "@/src/db/schema";
import { calculateAssessmentScore } from "@/src/scoring/risk";

export type AssessmentJourney = {
  attemptId: string | null;
  answers: Partial<Record<ScenarioKey, string>>;
};

export async function getAssessmentJourney(
  participantId: string,
): Promise<AssessmentJourney> {
  const [attempt] = await db
    .select({ id: assessmentAttempts.id })
    .from(assessmentAttempts)
    .innerJoin(
      consents,
      and(
        eq(consents.attemptId, assessmentAttempts.id),
        eq(consents.participantId, participantId),
        eq(consents.decision, true),
      ),
    )
    .where(
      and(
        eq(assessmentAttempts.participantId, participantId),
        eq(assessmentAttempts.source, "web"),
        eq(assessmentAttempts.status, "in_progress"),
      ),
    )
    .orderBy(desc(assessmentAttempts.startedAt))
    .limit(1);

  if (!attempt) return { attemptId: null, answers: {} };

  const drafts = await db
    .select({
      scenarioKey: assessmentDraftAnswers.scenarioKey,
      optionId: assessmentDraftAnswers.selectedOptionId,
    })
    .from(assessmentDraftAnswers)
    .where(eq(assessmentDraftAnswers.attemptId, attempt.id))
    .orderBy(asc(assessmentDraftAnswers.scenarioKey));

  return {
    attemptId: attempt.id,
    answers: Object.fromEntries(
      drafts.map(({ scenarioKey, optionId }) => [scenarioKey, optionId]),
    ) as Partial<Record<ScenarioKey, string>>,
  };
}

export async function recordConsent(input: {
  participantId: string;
  decision: boolean;
  idempotencyKey: string;
}) {
  if (!consentAllowsAssessment(input.decision)) {
    await db.transaction(async (transaction) => {
      await transaction
        .update(assessmentAttempts)
        .set({ status: "abandoned", updatedAt: sql`now()` })
        .where(
          and(
            eq(assessmentAttempts.participantId, input.participantId),
            eq(assessmentAttempts.source, "web"),
            eq(assessmentAttempts.status, "in_progress"),
          ),
        );
      await transaction.insert(consents).values({
        participantId: input.participantId,
        attemptId: null,
        decision: false,
        consentVersion: CONSENT_VERSION,
        source: "web",
      });
    });
    return { accepted: false as const, attemptId: null };
  }

  return db.transaction(async (transaction) => {
    const [activeContent] = await transaction
      .select({ id: contentVersions.id })
      .from(contentVersions)
      .where(
        and(
          eq(contentVersions.id, ASSESSMENT_CONTENT_VERSION),
          eq(contentVersions.isActive, true),
        ),
      )
      .limit(1);
    if (!activeContent) {
      throw new AssessmentError("content_unavailable", 503);
    }

    let [attempt] = await transaction
      .select({
        id: assessmentAttempts.id,
        contentVersionId: assessmentAttempts.contentVersionId,
      })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.participantId, input.participantId),
          eq(assessmentAttempts.source, "web"),
          eq(assessmentAttempts.status, "in_progress"),
        ),
      )
      .orderBy(desc(assessmentAttempts.startedAt))
      .limit(1);

    if (!attempt) {
      [attempt] = await transaction
        .insert(assessmentAttempts)
        .values({
          participantId: input.participantId,
          source: "web",
          status: "in_progress",
          idempotencyKey: input.idempotencyKey,
          contentVersionId: activeContent.id,
        })
        .onConflictDoNothing()
        .returning({
          id: assessmentAttempts.id,
          contentVersionId: assessmentAttempts.contentVersionId,
        });
    }

    if (!attempt) {
      [attempt] = await transaction
        .select({
          id: assessmentAttempts.id,
          contentVersionId: assessmentAttempts.contentVersionId,
        })
        .from(assessmentAttempts)
        .where(
          and(
            eq(assessmentAttempts.participantId, input.participantId),
            eq(assessmentAttempts.source, "web"),
            eq(assessmentAttempts.status, "in_progress"),
          ),
        )
        .limit(1);
    }

    if (!attempt || attempt.contentVersionId !== activeContent.id) {
      throw new AssessmentError("content_unavailable", 409);
    }

    await transaction
      .insert(consents)
      .values({
        participantId: input.participantId,
        attemptId: attempt.id,
        decision: true,
        consentVersion: CONSENT_VERSION,
        source: "web",
      })
      .onConflictDoNothing();

    return { accepted: true as const, attemptId: attempt.id };
  });
}

export async function saveDraftAnswer(input: {
  participantId: string;
  attemptId: string;
  scenarioKey: ScenarioKey;
  optionId: string;
}) {
  return db.transaction(async (transaction) => {
    const [attempt] = await transaction
      .select({ contentVersionId: assessmentAttempts.contentVersionId })
      .from(assessmentAttempts)
      .innerJoin(
        consents,
        and(
          eq(consents.attemptId, assessmentAttempts.id),
          eq(consents.participantId, input.participantId),
          eq(consents.decision, true),
        ),
      )
      .where(
        and(
          eq(assessmentAttempts.id, input.attemptId),
          eq(assessmentAttempts.participantId, input.participantId),
          eq(assessmentAttempts.status, "in_progress"),
          eq(assessmentAttempts.source, "web"),
        ),
      )
      .limit(1);
    if (!attempt?.contentVersionId) {
      throw new AssessmentError("attempt_not_found", 404);
    }

    const [allowedOption] = await transaction
      .select({ id: options.id })
      .from(options)
      .where(
        and(
          eq(options.contentVersionId, attempt.contentVersionId),
          eq(options.scenarioKey, input.scenarioKey),
          eq(options.id, input.optionId),
        ),
      )
      .limit(1);
    if (!allowedOption) throw new AssessmentError("invalid_input", 400);

    await transaction
      .insert(assessmentDraftAnswers)
      .values({
        attemptId: input.attemptId,
        contentVersionId: attempt.contentVersionId,
        scenarioKey: input.scenarioKey,
        selectedOptionId: input.optionId,
      })
      .onConflictDoUpdate({
        target: [
          assessmentDraftAnswers.attemptId,
          assessmentDraftAnswers.scenarioKey,
        ],
        set: {
          selectedOptionId: input.optionId,
          updatedAt: sql`now()`,
        },
      });
  });
}

export async function finalizeAssessment(input: {
  participantId: string;
  attemptId: string;
}) {
  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select id from assessment_attempts where id = ${input.attemptId} and participant_id = ${input.participantId} for update`,
    );

    const [attempt] = await transaction
      .select({
        status: assessmentAttempts.status,
        contentVersionId: assessmentAttempts.contentVersionId,
      })
      .from(assessmentAttempts)
      .innerJoin(
        consents,
        and(
          eq(consents.attemptId, assessmentAttempts.id),
          eq(consents.participantId, input.participantId),
          eq(consents.decision, true),
        ),
      )
      .where(
        and(
          eq(assessmentAttempts.id, input.attemptId),
          eq(assessmentAttempts.participantId, input.participantId),
          eq(assessmentAttempts.source, "web"),
        ),
      )
      .limit(1);
    if (!attempt?.contentVersionId) {
      throw new AssessmentError("consent_required", 403);
    }
    if (attempt.status === "completed") {
      return { completed: true as const, attemptId: input.attemptId };
    }
    if (attempt.status !== "in_progress") {
      throw new AssessmentError("attempt_not_found", 404);
    }

    const drafts = await transaction
      .select({
        scenarioKey: assessmentDraftAnswers.scenarioKey,
        optionId: assessmentDraftAnswers.selectedOptionId,
      })
      .from(assessmentDraftAnswers)
      .where(eq(assessmentDraftAnswers.attemptId, input.attemptId));
    const answers = drafts as Array<{
      scenarioKey: ScenarioKey;
      optionId: string;
    }>;
    if (!hasCompleteAnswerSet(answers)) {
      throw new AssessmentError("incomplete_answers", 400);
    }

    const [rubricVersion] = await transaction
      .select({
        id: rubricVersions.id,
        minimumScore: rubricVersions.minimumScore,
        maximumScore: rubricVersions.maximumScore,
      })
      .from(rubricVersions)
      .where(
        and(
          eq(rubricVersions.contentVersionId, attempt.contentVersionId),
          eq(rubricVersions.isActive, true),
        ),
      )
      .limit(1);
    if (
      !rubricVersion ||
      rubricVersion.minimumScore === null ||
      rubricVersion.maximumScore === null
    ) {
      throw new AssessmentError("scoring_unavailable", 503);
    }

    const rubric = await transaction
      .select({
        scenarioKey: rubricEntries.scenarioKey,
        optionId: rubricEntries.optionId,
        contribution: rubricEntries.contribution,
      })
      .from(rubricEntries)
      .where(eq(rubricEntries.rubricVersionId, rubricVersion.id));

    let score;
    try {
      score = calculateAssessmentScore(
        answers,
        rubric as Array<{
          scenarioKey: ScenarioKey;
          optionId: string;
          contribution: number;
        }>,
      );
    } catch {
      throw new AssessmentError("scoring_unavailable", 503);
    }
    if (
      score.totalScore < rubricVersion.minimumScore ||
      score.totalScore > rubricVersion.maximumScore
    ) {
      throw new AssessmentError("scoring_unavailable", 503);
    }

    await transaction.insert(responses).values(
      answers.map((answer) => ({
        attemptId: input.attemptId,
        contentVersionId: attempt.contentVersionId!,
        scenarioKey: answer.scenarioKey,
        selectedOptionId: answer.optionId,
        contribution: score.contributions.get(answer.scenarioKey)!,
      })),
    );

    await transaction
      .update(assessmentAttempts)
      .set({
        status: "completed",
        rubricVersionId: rubricVersion.id,
        totalScore: score.totalScore,
        risk: score.risk,
        completedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(eq(assessmentAttempts.id, input.attemptId));
    await transaction
      .delete(assessmentDraftAnswers)
      .where(eq(assessmentDraftAnswers.attemptId, input.attemptId));

    return { completed: true as const, attemptId: input.attemptId };
  });
}
