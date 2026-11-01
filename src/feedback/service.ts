import "server-only";

import { and, eq } from "drizzle-orm";

import { AssessmentError } from "@/src/assessment/errors";
import { db } from "@/src/db";
import {
  assessmentAttempts,
  assessmentFeedback,
  consents,
} from "@/src/db/schema";
import { feedbackInputSchema } from "@/src/feedback/validation";

export async function hasAssessmentFeedback(
  participantId: string,
  attemptId: string,
) {
  const [feedback] = await db
    .select({ id: assessmentFeedback.id })
    .from(assessmentFeedback)
    .where(
      and(
        eq(assessmentFeedback.attemptId, attemptId),
        eq(assessmentFeedback.participantId, participantId),
      ),
    )
    .limit(1);
  return Boolean(feedback);
}

export async function submitAssessmentFeedback(
  participantId: string,
  input: unknown,
) {
  const parsed = feedbackInputSchema.safeParse(input);
  if (!parsed.success) throw new AssessmentError("invalid_input", 400);
  const data = parsed.data;

  await db.transaction(async (transaction) => {
    // Lock the owned completion until insert finishes, matching assessment mutations.
    const [attempt] = await transaction
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
          eq(assessmentAttempts.id, data.attemptId),
          eq(assessmentAttempts.participantId, participantId),
          eq(assessmentAttempts.source, "web"),
          eq(assessmentAttempts.status, "completed"),
        ),
      )
      .limit(1)
      .for("update", { of: assessmentAttempts });
    if (!attempt) throw new AssessmentError("attempt_not_found", 404);

    // Retries are successful without replacing any original response or timestamp.
    await transaction
      .insert(assessmentFeedback)
      .values({
        ...data,
        participantId,
        comments: data.comments || null,
      })
      .onConflictDoNothing({ target: assessmentFeedback.attemptId });
  });
}
