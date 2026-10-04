ALTER TABLE "assessment_attempts" ADD COLUMN "score_percentage" numeric(5, 2);

ALTER TABLE "assessment_attempts" DROP CONSTRAINT "attempts_completion_shape_check";
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_completion_shape_check" CHECK (
  (status = 'completed'
    AND content_version_id IS NOT NULL
    AND rubric_version_id IS NOT NULL
    AND total_score IS NOT NULL
    AND (rubric_version_id <> 'cyberawaregaza-safe-decisions-v2' OR score_percentage IS NOT NULL)
    AND risk IS NOT NULL
    AND (source = 'google_form' OR completed_at IS NOT NULL))
  OR (status <> 'completed' AND completed_at IS NULL)
);
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_percentage_check"
  CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100));

CREATE TABLE "scoring_revision_audit" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "attempt_id" uuid NOT NULL,
  "from_rubric_version_id" varchar(64) NOT NULL,
  "to_rubric_version_id" varchar(64) NOT NULL,
  "previous_total_score" integer NOT NULL,
  "previous_percentage" numeric(5, 2),
  "previous_risk" "risk_category" NOT NULL,
  "revised_total_score" integer NOT NULL,
  "revised_percentage" numeric(5, 2) NOT NULL,
  "revised_risk" "risk_category" NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "scoring_revision_attempt_target_unique" UNIQUE("attempt_id", "to_rubric_version_id"),
  CONSTRAINT "scoring_revision_audit_attempt_id_assessment_attempts_id_fk"
    FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE
);
CREATE INDEX "scoring_revision_target_created_idx"
  ON "scoring_revision_audit" USING btree ("to_rubric_version_id", "created_at");

ALTER TABLE "rubric_versions" DISABLE ROW LEVEL SECURITY;
UPDATE "rubric_versions" SET "is_active" = false WHERE "is_active" = true;
INSERT INTO "rubric_versions"
  ("id", "content_version_id", "label", "is_active", "minimum_score", "maximum_score", "approved_at")
VALUES
  ('cyberawaregaza-safe-decisions-v2', 'pdf-section-7-v1',
   'CyberAwareGaza 0-80 safe cybersecurity decisions model', true, 0, 80, now())
ON CONFLICT ("id") DO UPDATE SET
  "label" = excluded."label",
  "is_active" = true,
  "minimum_score" = excluded."minimum_score",
  "maximum_score" = excluded."maximum_score",
  "approved_at" = coalesce("rubric_versions"."approved_at", excluded."approved_at");

INSERT INTO "rubric_entries"
  ("rubric_version_id", "content_version_id", "scenario_key", "option_id", "contribution", "feedback_en", "feedback_ar")
SELECT
  'cyberawaregaza-safe-decisions-v2', "content_version_id", "scenario_key", "option_id",
  CASE
    WHEN "scenario_key" = 'S4' AND "option_id" = 'S4O2' THEN 8
    WHEN "contribution" = -10 THEN 0
    WHEN "contribution" = -8 THEN 2
    WHEN "contribution" = 2 THEN 4
    WHEN "contribution" IN (4, 6) THEN 6
    WHEN "contribution" = 8 THEN 8
    WHEN "contribution" = 10 THEN 10
    ELSE NULL
  END,
  "feedback_en", "feedback_ar"
FROM "rubric_entries"
WHERE "rubric_version_id" = 'chapter-3-section-3.4-s4-revision-v1'
ON CONFLICT ("rubric_version_id", "scenario_key", "option_id") DO UPDATE SET
  "contribution" = excluded."contribution",
  "feedback_en" = excluded."feedback_en",
  "feedback_ar" = excluded."feedback_ar";

ALTER TABLE "scoring_revision_audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rubric_versions" ENABLE ROW LEVEL SECURITY;
