ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "admin_audit" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "consents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "content_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "counters" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "import_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "import_rows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "participants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "responses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rubric_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rubric_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "scenarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM "responses") OR EXISTS (SELECT 1 FROM "rubric_versions") THEN
		RAISE EXCEPTION 'Migration 0002 requires empty responses and rubric_versions tables; backfill content version references before retrying.';
	END IF;
END $$;--> statement-breakpoint
ALTER TABLE "participants" DROP CONSTRAINT "participants_shape_check";--> statement-breakpoint
ALTER TABLE "assessment_attempts" DROP CONSTRAINT "assessment_attempts_rubric_version_id_rubric_versions_id_fk";
--> statement-breakpoint
ALTER TABLE "consents" DROP CONSTRAINT "consents_attempt_id_assessment_attempts_id_fk";
--> statement-breakpoint
ALTER TABLE "responses" DROP CONSTRAINT "responses_attempt_id_assessment_attempts_id_fk";
--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "content_version_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "rubric_versions" ADD COLUMN "content_version_id" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_id_participant_unique" UNIQUE("id","participant_id");--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_id_content_unique" UNIQUE("id","content_version_id");--> statement-breakpoint
ALTER TABLE "rubric_versions" ADD CONSTRAINT "rubric_versions_id_content_unique" UNIQUE("id","content_version_id");--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_rubric_content_fk" FOREIGN KEY ("rubric_version_id","content_version_id") REFERENCES "public"."rubric_versions"("id","content_version_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_attempt_participant_fk" FOREIGN KEY ("attempt_id","participant_id") REFERENCES "public"."assessment_attempts"("id","participant_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_attempt_content_fk" FOREIGN KEY ("attempt_id","content_version_id") REFERENCES "public"."assessment_attempts"("id","content_version_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_selected_option_fk" FOREIGN KEY ("content_version_id","scenario_key","selected_option_id") REFERENCES "public"."options"("content_version_id","scenario_key","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_entries" ADD CONSTRAINT "rubric_entries_version_content_fk" FOREIGN KEY ("rubric_version_id","content_version_id") REFERENCES "public"."rubric_versions"("id","content_version_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_versions" ADD CONSTRAINT "rubric_versions_content_version_id_content_versions_id_fk" FOREIGN KEY ("content_version_id") REFERENCES "public"."content_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_action_created_idx" ON "admin_audit" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "attempts_status_updated_idx" ON "assessment_attempts" USING btree ("status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_versions_one_active_idx" ON "content_versions" USING btree ("is_active") WHERE "content_versions"."is_active";--> statement-breakpoint
CREATE INDEX "import_batches_state_created_idx" ON "import_batches" USING btree ("state","created_at");--> statement-breakpoint
CREATE INDEX "import_rows_batch_state_idx" ON "import_rows" USING btree ("batch_id","state");--> statement-breakpoint
CREATE INDEX "participants_type_created_idx" ON "participants" USING btree ("type","created_at");--> statement-breakpoint
CREATE INDEX "participants_source_created_idx" ON "participants" USING btree ("source","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "rubric_versions_one_active_idx" ON "rubric_versions" USING btree ("is_active") WHERE "rubric_versions"."is_active";--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_attempt_unique" UNIQUE("attempt_id");--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_source_key_unique" UNIQUE("batch_id","source_row_key");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_username_check" CHECK (char_length(btrim("accounts"."username")) between 3 and 80);--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_normalized_username_check" CHECK (char_length(btrim("accounts"."normalized_username")) between 3 and 80 and "accounts"."normalized_username" = lower("accounts"."normalized_username"));--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_display_name_check" CHECK ("accounts"."display_name" is null or char_length(btrim("accounts"."display_name")) between 1 and 120);--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_password_hash_check" CHECK (char_length("accounts"."password_hash") > 0);--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_action_check" CHECK (char_length(btrim("admin_audit"."action")) > 0);--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_source_shape_check" CHECK (("assessment_attempts"."source" = 'web' and "assessment_attempts"."source_submission_key" is null)
        or ("assessment_attempts"."source" = 'google_form' and "assessment_attempts"."source_submission_key" is not null));--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "attempts_completion_shape_check" CHECK (("assessment_attempts"."status" = 'completed' and "assessment_attempts"."content_version_id" is not null and "assessment_attempts"."rubric_version_id" is not null and "assessment_attempts"."total_score" is not null and "assessment_attempts"."risk" is not null and "assessment_attempts"."completed_at" is not null)
        or ("assessment_attempts"."status" <> 'completed' and "assessment_attempts"."completed_at" is null));--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_version_check" CHECK (char_length(btrim("consents"."consent_version")) > 0);--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_id_check" CHECK (char_length(btrim("content_versions"."id")) > 0);--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_label_check" CHECK (char_length(btrim("content_versions"."label")) > 0);--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_approval_check" CHECK (not "content_versions"."is_active" or "content_versions"."approved_at" is not null);--> statement-breakpoint
ALTER TABLE "counters" ADD CONSTRAINT "counters_key_check" CHECK (char_length(btrim("counters"."key")) > 0);--> statement-breakpoint
ALTER TABLE "counters" ADD CONSTRAINT "counters_value_check" CHECK ("counters"."value" >= 0);--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_checksum_check" CHECK ("import_batches"."checksum" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_filename_check" CHECK (char_length(btrim("import_batches"."original_filename")) between 1 and 255);--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_counts_check" CHECK ("import_batches"."total_rows" >= 0 and "import_batches"."accepted_rows" >= 0 and "import_batches"."excluded_rows" >= 0 and "import_batches"."duplicate_rows" >= 0
        and ("import_batches"."accepted_rows" + "import_batches"."excluded_rows" + "import_batches"."duplicate_rows") <= "import_batches"."total_rows");--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_commit_shape_check" CHECK (("import_batches"."state" = 'committed' and "import_batches"."committed_at" is not null)
        or ("import_batches"."state" <> 'committed' and "import_batches"."committed_at" is null));--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_row_number_check" CHECK ("import_rows"."row_number" > 0);--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_rejection_shape_check" CHECK (("import_rows"."state" = 'excluded' and "import_rows"."rejection_code" is not null)
        or ("import_rows"."state" <> 'excluded' and "import_rows"."rejection_code" is null and "import_rows"."rejection_detail" is null));--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_id_check" CHECK (char_length(btrim("options"."id")) > 0);--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_order_check" CHECK ("options"."display_order" > 0);--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_text_check" CHECK (char_length(btrim("options"."text_en")) > 0 and char_length(btrim("options"."text_ar")) > 0);--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_public_code_check" CHECK ("participants"."public_code" ~ '^CAG-[0-9]{4,}$');--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_anonymous_ordinal_check" CHECK ("participants"."anonymous_ordinal" is null or "participants"."anonymous_ordinal" > 0);--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_source_shape_check" CHECK (("participants"."type" in ('registered', 'anonymous') and "participants"."source" = 'web' and "participants"."source_participant_key" is null)
        or ("participants"."type" = 'imported' and "participants"."source" = 'google_form' and "participants"."source_participant_key" is not null));--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_shape_check" CHECK (("participants"."type" = 'registered' and "participants"."account_id" is not null and "participants"."anonymous_ordinal" is null)
        or ("participants"."type" = 'anonymous' and "participants"."account_id" is null and "participants"."anonymous_ordinal" is not null)
        or ("participants"."type" = 'imported' and "participants"."account_id" is null and "participants"."anonymous_ordinal" is null));--> statement-breakpoint
ALTER TABLE "rubric_entries" ADD CONSTRAINT "rubric_entries_scenario_key_check" CHECK ("rubric_entries"."scenario_key" in ('S1','S2','S3','S4','S5','S6','S7','S8'));--> statement-breakpoint
ALTER TABLE "rubric_versions" ADD CONSTRAINT "rubric_versions_id_check" CHECK (char_length(btrim("rubric_versions"."id")) > 0);--> statement-breakpoint
ALTER TABLE "rubric_versions" ADD CONSTRAINT "rubric_versions_label_check" CHECK (char_length(btrim("rubric_versions"."label")) > 0);--> statement-breakpoint
ALTER TABLE "rubric_versions" ADD CONSTRAINT "rubric_versions_score_range_check" CHECK (("rubric_versions"."minimum_score" is null and "rubric_versions"."maximum_score" is null)
        or ("rubric_versions"."minimum_score" is not null and "rubric_versions"."maximum_score" is not null and "rubric_versions"."minimum_score" <= "rubric_versions"."maximum_score"));--> statement-breakpoint
ALTER TABLE "rubric_versions" ADD CONSTRAINT "rubric_versions_approval_check" CHECK (not "rubric_versions"."is_active" or ("rubric_versions"."approved_at" is not null and "rubric_versions"."minimum_score" is not null and "rubric_versions"."maximum_score" is not null));--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_key_order_check" CHECK ("scenarios"."display_order" = substring("scenarios"."key" from 2)::integer);--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_text_check" CHECK (char_length(btrim("scenarios"."question_en")) > 0 and char_length(btrim("scenarios"."question_ar")) > 0);--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_token_hash_check" CHECK ("sessions"."token_hash" ~ '^[0-9a-f]{64}$');--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_expiry_check" CHECK ("sessions"."expires_at" > "sessions"."created_at");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_revocation_check" CHECK ("sessions"."revoked_at" is null or "sessions"."revoked_at" >= "sessions"."created_at");
