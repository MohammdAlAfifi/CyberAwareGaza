import "server-only";

import { and, count, desc, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { assessmentAttempts } from "@/src/db/schema";

export type ParticipantAssessmentSummary = {
  status: "not_started" | "in_progress" | "completed";
  /** Counts every persisted attempt, including an in-progress attempt. */
  attemptCount: number;
  latestRisk: "low" | "medium" | "high" | null;
};

export async function getParticipantAssessmentSummary(
  participantId: string,
): Promise<ParticipantAssessmentSummary> {
  const [statusCounts, latestCompleted] = await Promise.all([
    db
      .select({ status: assessmentAttempts.status, count: count() })
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.participantId, participantId))
      .groupBy(assessmentAttempts.status),
    db
      .select({ risk: assessmentAttempts.risk })
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
      )
      .limit(1),
  ]);

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
    latestRisk: latestCompleted[0]?.risk ?? null,
  };
}
