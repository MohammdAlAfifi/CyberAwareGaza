ALTER TYPE "public"."import_row_state" ADD VALUE IF NOT EXISTS 'invalid' BEFORE 'duplicate';--> statement-breakpoint
ALTER TYPE "public"."import_state" ADD VALUE IF NOT EXISTS 'duplicate' BEFORE 'failed';--> statement-breakpoint
ALTER TABLE "import_batches" DROP CONSTRAINT "import_batches_checksum_unique";--> statement-breakpoint
ALTER TABLE "assessment_attempts" DROP CONSTRAINT "attempts_completion_shape_check";--> statement-breakpoint
ALTER TABLE "import_batches" DROP CONSTRAINT "import_batches_counts_check";--> statement-breakpoint
ALTER TABLE "import_rows" DROP CONSTRAINT "import_rows_rejection_shape_check";--> statement-breakpoint
ALTER TABLE "participants" DROP CONSTRAINT "participants_shape_check";--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "source_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "import_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD COLUMN "source_record_number" integer;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "source" "collection_source" DEFAULT 'google_form' NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "invalid_rows" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "imported_assessments" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "import_batches" ADD COLUMN "validation_summary" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "import_rows" ADD COLUMN "participant_id" uuid;--> statement-breakpoint
ALTER TABLE "import_rows" ADD COLUMN "attempt_id" uuid;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "import_batch_id" uuid;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "source_record_number" integer;--> statement-breakpoint
WITH "base" AS (
  SELECT greatest(
    coalesce((SELECT "value" FROM "counters" WHERE "key" = 'anonymous_ordinal'), 0),
    coalesce((SELECT max("anonymous_ordinal") FROM "participants"), 0)
  ) AS "value"
), "numbered" AS (
  SELECT "id", row_number() over (order by "created_at", "id") AS "ordinal"
  FROM "participants"
  WHERE "type" = 'imported' AND "anonymous_ordinal" IS NULL
)
UPDATE "participants" p
SET "anonymous_ordinal" = ("base"."value" + "numbered"."ordinal")::integer
FROM "base", "numbered"
WHERE p."id" = "numbered"."id";--> statement-breakpoint
INSERT INTO "counters" ("key", "value")
VALUES ('anonymous_ordinal', coalesce((SELECT max("anonymous_ordinal") FROM "participants"), 0))
ON CONFLICT ("key") DO UPDATE SET "value" = greatest("counters"."value", excluded."value");--> statement-breakpoint
UPDATE "import_batches"
SET "invalid_rows" = greatest(0, "total_rows" - "accepted_rows" - "excluded_rows" - "duplicate_rows");--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_import_batch_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_import_batch_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "import_batches_committed_checksum_unique" ON "import_batches" USING btree ("checksum") WHERE "import_batches"."state" = 'committed';--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_import_shape_check" CHECK (("assessment_attempts"."source" = 'web' and "assessment_attempts"."import_batch_id" is null and "assessment_attempts"."source_record_number" is null and "assessment_attempts"."source_submitted_at" is null)
        or ("assessment_attempts"."source" = 'google_form' and "assessment_attempts"."import_batch_id" is not null and "assessment_attempts"."source_record_number" is not null and "assessment_attempts"."source_record_number" > 1));--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_completion_shape_check" CHECK (("assessment_attempts"."status" = 'completed' and "assessment_attempts"."content_version_id" is not null and "assessment_attempts"."rubric_version_id" is not null and "assessment_attempts"."total_score" is not null and "assessment_attempts"."risk" is not null and ("assessment_attempts"."source" = 'google_form' or "assessment_attempts"."completed_at" is not null))
        or ("assessment_attempts"."status" <> 'completed' and "assessment_attempts"."completed_at" is null));--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_counts_check" CHECK ("import_batches"."total_rows" >= 0 and "import_batches"."accepted_rows" >= 0 and "import_batches"."excluded_rows" >= 0 and "import_batches"."duplicate_rows" >= 0 and "import_batches"."invalid_rows" >= 0 and "import_batches"."imported_assessments" >= 0
        and ("import_batches"."accepted_rows" + "import_batches"."excluded_rows" + "import_batches"."duplicate_rows" + "import_batches"."invalid_rows") = "import_batches"."total_rows"
        and "import_batches"."imported_assessments" <= "import_batches"."accepted_rows");--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_result_shape_check" CHECK (("import_rows"."participant_id" is null and "import_rows"."attempt_id" is null)
        or ("import_rows"."state" = 'accepted' and "import_rows"."participant_id" is not null and "import_rows"."attempt_id" is not null));--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_rejection_shape_check" CHECK (("import_rows"."state" in ('excluded', 'invalid', 'duplicate') and "import_rows"."rejection_code" is not null)
        or ("import_rows"."state" = 'accepted' and "import_rows"."rejection_code" is null and "import_rows"."rejection_detail" is null));--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_shape_check" CHECK (("participants"."type" = 'registered' and "participants"."account_id" is not null and "participants"."anonymous_ordinal" is null)
        or ("participants"."type" = 'anonymous' and "participants"."account_id" is null and "participants"."anonymous_ordinal" is not null)
        or ("participants"."type" = 'imported' and "participants"."account_id" is null and "participants"."anonymous_ordinal" is not null));
