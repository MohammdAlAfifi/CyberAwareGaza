import "server-only";

import { sql } from "drizzle-orm";

import {
  feedbackPercentage,
  feedbackRatingSummary,
  type RatingCount,
} from "@/src/admin/feedback-statistics";
import { AuthError } from "@/src/auth/errors";
import type { SessionActor } from "@/src/auth/sessions";
import { db } from "@/src/db";
import { ratingFields } from "@/src/feedback/validation";

function assertFeedbackAdmin(actor: SessionActor | null) {
  if (!actor || actor.kind !== "admin" || actor.mustChangePassword) {
    throw new AuthError("forbidden", 403);
  }
}

export const FEEDBACK_COMMENTS_LIMIT = 20;

export async function getFeedbackCount(
  actor: SessionActor | null,
): Promise<number> {
  assertFeedbackAdmin(actor);
  const result = await db.execute<{ total: number }>(sql`
    select count(*)::integer as total from assessment_feedback where consent = true
  `);
  return Number(result.rows[0].total);
}

type FeedbackOverview = {
  total: number;
  yes: number;
  no: number;
  writtenComments: number;
  completedAssessments: number;
};

export type FeedbackComment = {
  id: string;
  publicCode: string | null;
  submittedAt: Date | string;
  satisfactionRating: number;
  technicalProblem: boolean;
  comments: string;
};

export type FeedbackAnalytics = Awaited<
  ReturnType<typeof getFeedbackAnalytics>
>;

export async function getFeedbackAnalytics(actor: SessionActor | null) {
  assertFeedbackAdmin(actor);
  // A consistent, read-only snapshot. Neither query joins response/answer rows.
  // No cache: requireAdmin reads the current session on each page request.
  return db.transaction(
    async (transaction) => {
      const overviewResult = await transaction.execute<FeedbackOverview>(sql`
      select count(*)::integer as total,
             count(*) filter (where f.technical_problem is true)::integer as yes,
             count(*) filter (where f.technical_problem is false)::integer as no,
             count(*) filter (where nullif(btrim(f.comments), '') is not null)::integer as "writtenComments",
             (select count(*)::integer from assessment_attempts aa
               where aa.source = 'web' and aa.status = 'completed'
                 and exists (select 1 from consents c where c.attempt_id = aa.id
                   and c.participant_id = aa.participant_id and c.source = 'web' and c.decision = true)
             ) as "completedAssessments"
        from assessment_feedback f where f.consent = true
    `);
      const ratingsResult = await transaction.execute<RatingCount>(sql`
      select v.question, v.rating, count(*)::integer as count
        from assessment_feedback f
        cross join lateral (values
          ('navigationRating', f.navigation_rating),
          ('scenarioClarityRating', f.scenario_clarity_rating),
          ('interactionRating', f.interaction_rating),
          ('readabilityRating', f.readability_rating),
          ('satisfactionRating', f.satisfaction_rating)
        ) as v(question, rating)
       where f.consent = true and v.rating between 1 and 5
       group by v.question, v.rating
    `);
      const commentsResult = await transaction.execute<FeedbackComment>(sql`
      select f.id, p.public_code as "publicCode", f.submitted_at as "submittedAt",
             f.satisfaction_rating as "satisfactionRating", f.technical_problem as "technicalProblem", f.comments
        from assessment_feedback f
        left join participants p on p.id = f.participant_id
       where f.consent = true and nullif(btrim(f.comments), '') is not null
       order by f.submitted_at desc, f.id desc
       limit ${FEEDBACK_COMMENTS_LIMIT}
    `);
      const overview = overviewResult.rows[0];
      const total = Number(overview.total);
      const yes = Number(overview.yes);
      const no = Number(overview.no);
      const validTechnicalCount = yes + no;
      const completedAssessments = Number(overview.completedAssessments);
      return {
        total,
        completedAssessments,
        responseRate: feedbackPercentage(total, completedAssessments),
        writtenComments: Number(overview.writtenComments),
        questions: ratingFields.map((question) =>
          feedbackRatingSummary(question, ratingsResult.rows),
        ),
        technical: {
          validCount: validTechnicalCount,
          yes: {
            count: yes,
            percentage: feedbackPercentage(yes, validTechnicalCount),
          },
          no: {
            count: no,
            percentage: feedbackPercentage(no, validTechnicalCount),
          },
        },
        comments: commentsResult.rows,
      };
    },
    { isolationLevel: "repeatable read", accessMode: "read only" },
  );
}
