CREATE TABLE "assessment_feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "attempt_id" uuid NOT NULL,
  "participant_id" uuid NOT NULL,
  "navigation_rating" integer NOT NULL,
  "scenario_clarity_rating" integer NOT NULL,
  "interaction_rating" integer NOT NULL,
  "readability_rating" integer NOT NULL,
  "satisfaction_rating" integer NOT NULL,
  "technical_problem" boolean NOT NULL,
  "comments" varchar(2000),
  "consent" boolean NOT NULL,
  "consented_at" timestamp with time zone DEFAULT now() NOT NULL,
  "submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
  "language" varchar(2) NOT NULL,
  CONSTRAINT "assessment_feedback_attempt_unique" UNIQUE ("attempt_id"),
  CONSTRAINT "assessment_feedback_attempt_participant_fk" FOREIGN KEY ("attempt_id", "participant_id")
    REFERENCES "assessment_attempts" ("id", "participant_id") ON DELETE CASCADE,
  CONSTRAINT "assessment_feedback_navigation_check" CHECK ("navigation_rating" BETWEEN 1 AND 5),
  CONSTRAINT "assessment_feedback_scenario_clarity_check" CHECK ("scenario_clarity_rating" BETWEEN 1 AND 5),
  CONSTRAINT "assessment_feedback_interaction_check" CHECK ("interaction_rating" BETWEEN 1 AND 5),
  CONSTRAINT "assessment_feedback_readability_check" CHECK ("readability_rating" BETWEEN 1 AND 5),
  CONSTRAINT "assessment_feedback_satisfaction_check" CHECK ("satisfaction_rating" BETWEEN 1 AND 5),
  CONSTRAINT "assessment_feedback_consent_check" CHECK ("consent" = true),
  CONSTRAINT "assessment_feedback_language_check" CHECK ("language" IN ('en', 'ar'))
);
--> statement-breakpoint
ALTER TABLE "assessment_feedback" ENABLE ROW LEVEL SECURITY;
