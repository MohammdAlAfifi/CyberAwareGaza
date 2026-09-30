import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { assessmentAttempts } from "@/src/db/schema";

export type ParticipantAssessmentSummary = {
  status: "not_started" | "in_progress" | "completed";
  /** Counts every persisted attempt, including an in-progress attempt. */
  attemptCount: number;
  latestRisk: "low" | "medium" | "high" | null;
  history: Array<{
    attemptId: string;
    totalScore: number;
    risk: "low" | "medium" | "high";
    completedAt: Date;
  }>;
};

export async function getParticipantAssessmentSummary(
  participantId: string,
): Promise<ParticipantAssessmentSummary> {
  const [statusCounts, completedAttempts] = await Promise.all([
    db
      .select({ status: assessmentAttempts.status, count: count() })
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.participantId, participantId))
      .groupBy(assessmentAttempts.status),
    db
      .select({
        attemptId: assessmentAttempts.id,
        totalScore: assessmentAttempts.totalScore,
        risk: assessmentAttempts.risk,
        completedAt: assessmentAttempts.completedAt,
      })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.participantId, participantId),
          eq(assessmentAttempts.status, "completed"),
        ),
      )
      .orderBy(
        desc(assessmentAttempts.completedAt),
        desc(assessmentAttempts.updatedAt),
        desc(assessmentAttempts.id),
      ),
  ]);

  const history = completedAttempts.flatMap((attempt) =>
    attempt.totalScore === null ||
    attempt.risk === null ||
    attempt.completedAt === null
      ? []
      : [
          {
            attemptId: attempt.attemptId,
            totalScore: attempt.totalScore,
            risk: attempt.risk,
            completedAt: attempt.completedAt,
          },
        ],
  );

  const attemptCount = statusCounts.reduce(
    (total, status) => total + status.count,
    0,
  );
  const hasInProgress = statusCounts.some(
    ({ count: statusCount, status }) =>
      status === "in_progress" && statusCount > 0,
  );
  const hasCompleted = statusCounts.some(
    ({ count: statusCount, status }) =>
      status === "completed" && statusCount > 0,
  );

  return {
    status: hasInProgress
      ? "in_progress"
      : hasCompleted
        ? "completed"
        : "not_started",
    attemptCount,
    latestRisk: history[0]?.risk ?? null,
    history,
  };
}
