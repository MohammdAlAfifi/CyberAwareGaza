CREATE TYPE "public"."account_role" AS ENUM('participant', 'admin');--> statement-breakpoint
CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'completed', 'abandoned', 'excluded');--> statement-breakpoint
CREATE TYPE "public"."collection_source" AS ENUM('web', 'google_form');--> statement-breakpoint
CREATE TYPE "public"."import_row_state" AS ENUM('accepted', 'excluded', 'duplicate');--> statement-breakpoint
CREATE TYPE "public"."import_state" AS ENUM('previewed', 'committed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."participant_type" AS ENUM('registered', 'anonymous', 'imported');--> statement-breakpoint
CREATE TYPE "public"."risk_category" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."session_kind" AS ENUM('account', 'anonymous');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_username" varchar(80) NOT NULL,
	"username" varchar(80) NOT NULL,
	"display_name" varchar(120),
	"password_hash" text NOT NULL,
	"role" "account_role" DEFAULT 'participant' NOT NULL,
	"language" varchar(2) DEFAULT 'en' NOT NULL,
	"password_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_normalized_username_unique" UNIQUE("normalized_username"),
	CONSTRAINT "accounts_language_check" CHECK ("accounts"."language" in ('en', 'ar'))
);
--> statement-breakpoint
CREATE TABLE "admin_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_account_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"source" "collection_source" NOT NULL,
	"source_submission_key" varchar(200),
	"idempotency_key" uuid,
	"content_version_id" varchar(64),
	"rubric_version_id" varchar(64),
	"total_score" integer,
	"risk" "risk_category",
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempts_source_submission_unique" UNIQUE("source","source_submission_key"),
	CONSTRAINT "attempts_participant_idempotency_unique" UNIQUE("participant_id","idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"attempt_id" uuid,
	"decision" boolean NOT NULL,
	"consent_version" varchar(64) NOT NULL,
	"source" "collection_source" NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counters" (
	"key" varchar(40) PRIMARY KEY NOT NULL,
	"value" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"original_filename" varchar(255) NOT NULL,
	"state" "import_state" NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"accepted_rows" integer DEFAULT 0 NOT NULL,
	"excluded_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"created_by_account_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"committed_at" timestamp with time zone,
	CONSTRAINT "import_batches_checksum_unique" UNIQUE("checksum")
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"source_row_key" varchar(200),
	"state" "import_row_state" NOT NULL,
	"rejection_code" varchar(80),
	"rejection_detail" text,
	CONSTRAINT "import_rows_batch_id_row_number_pk" PRIMARY KEY("batch_id","row_number")
);
--> statement-breakpoint
CREATE TABLE "options" (
	"content_version_id" varchar(64) NOT NULL,
	"scenario_key" varchar(2) NOT NULL,
	"id" varchar(48) NOT NULL,
	"display_order" integer NOT NULL,
	"text_en" text NOT NULL,
	"text_ar" text NOT NULL,
	CONSTRAINT "options_content_version_id_scenario_key_id_pk" PRIMARY KEY("content_version_id","scenario_key","id"),
	CONSTRAINT "options_version_scenario_order_unique" UNIQUE("content_version_id","scenario_key","display_order")
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_code" varchar(24) NOT NULL,
	"account_id" uuid,
	"type" "participant_type" NOT NULL,
	"anonymous_ordinal" integer,
	"source" "collection_source" NOT NULL,
	"source_participant_key" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "participants_public_code_unique" UNIQUE("public_code"),
	CONSTRAINT "participants_account_unique" UNIQUE("account_id"),
	CONSTRAINT "participants_anonymous_ordinal_unique" UNIQUE("anonymous_ordinal"),
	CONSTRAINT "participants_source_key_unique" UNIQUE("source","source_participant_key"),
	CONSTRAINT "participants_shape_check" CHECK (("participants"."type" = 'registered' and "participants"."account_id" is not null and "participants"."anonymous_ordinal" is null)
        or ("participants"."type" = 'anonymous' and "participants"."account_id" is null and "participants"."anonymous_ordinal" is not null)
        or ("participants"."type" = 'imported' and "participants"."account_id" is null))
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"attempt_id" uuid NOT NULL,
	"scenario_key" varchar(2) NOT NULL,
	"selected_option_id" varchar(48) NOT NULL,
	"contribution" integer NOT NULL,
	"feedback_key" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "responses_attempt_id_scenario_key_pk" PRIMARY KEY("attempt_id","scenario_key"),
	CONSTRAINT "responses_scenario_key_check" CHECK ("responses"."scenario_key" in ('S1','S2','S3','S4','S5','S6','S7','S8'))
);
--> statement-breakpoint
CREATE TABLE "rubric_entries" (
	"rubric_version_id" varchar(64) NOT NULL,
	"content_version_id" varchar(64) NOT NULL,
	"scenario_key" varchar(2) NOT NULL,
	"option_id" varchar(48) NOT NULL,
	"contribution" integer NOT NULL,
	"feedback_en" text,
	"feedback_ar" text,
	CONSTRAINT "rubric_entries_rubric_version_id_scenario_key_option_id_pk" PRIMARY KEY("rubric_version_id","scenario_key","option_id")
);
--> statement-breakpoint
CREATE TABLE "rubric_versions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"label" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"minimum_score" integer,
	"maximum_score" integer,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"content_version_id" varchar(64) NOT NULL,
	"key" varchar(2) NOT NULL,
	"display_order" integer NOT NULL,
	"question_en" text NOT NULL,
	"question_ar" text NOT NULL,
	CONSTRAINT "scenarios_content_version_id_key_pk" PRIMARY KEY("content_version_id","key"),
	CONSTRAINT "scenarios_version_order_unique" UNIQUE("content_version_id","display_order"),
	CONSTRAINT "scenarios_key_check" CHECK ("scenarios"."key" in ('S1','S2','S3','S4','S5','S6','S7','S8')),
	CONSTRAINT "scenarios_order_check" CHECK ("scenarios"."display_order" between 1 and 8)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"kind" "session_kind" NOT NULL,
	"account_id" uuid,
	"participant_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "sessions_actor_check" CHECK (("sessions"."kind" = 'account' and "sessions"."account_id" is not null)
        or ("sessions"."kind" = 'anonymous' and "sessions"."account_id" is null and "sessions"."participant_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "admin_audit" ADD CONSTRAINT "admin_audit_actor_account_id_accounts_id_fk" FOREIGN KEY ("actor_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_content_version_id_content_versions_id_fk" FOREIGN KEY ("content_version_id") REFERENCES "public"."content_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_rubric_version_id_rubric_versions_id_fk" FOREIGN KEY ("rubric_version_id") REFERENCES "public"."rubric_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_account_id_accounts_id_fk" FOREIGN KEY ("created_by_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_batch_id_import_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_attempt_id_assessment_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."assessment_attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_entries" ADD CONSTRAINT "rubric_entries_rubric_version_id_rubric_versions_id_fk" FOREIGN KEY ("rubric_version_id") REFERENCES "public"."rubric_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_entries" ADD CONSTRAINT "rubric_entries_content_version_id_content_versions_id_fk" FOREIGN KEY ("content_version_id") REFERENCES "public"."content_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_content_version_id_content_versions_id_fk" FOREIGN KEY ("content_version_id") REFERENCES "public"."content_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_audit_actor_created_idx" ON "admin_audit" USING btree ("actor_account_id","created_at");--> statement-breakpoint
CREATE INDEX "attempts_participant_completed_idx" ON "assessment_attempts" USING btree ("participant_id","completed_at");--> statement-breakpoint
CREATE INDEX "attempts_source_status_idx" ON "assessment_attempts" USING btree ("source","status");--> statement-breakpoint
CREATE INDEX "consents_participant_decided_idx" ON "consents" USING btree ("participant_id","decided_at");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" USING btree ("expires_at");