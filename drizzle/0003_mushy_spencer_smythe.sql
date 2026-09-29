CREATE TABLE "rate_limits" (
	"bucket" varchar(40) NOT NULL,
	"key_hash" varchar(64) NOT NULL,
	"window_started_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "rate_limits_bucket_key_hash_pk" PRIMARY KEY("bucket","key_hash"),
	CONSTRAINT "rate_limits_bucket_check" CHECK (char_length(btrim("rate_limits"."bucket")) > 0),
	CONSTRAINT "rate_limits_key_hash_check" CHECK ("rate_limits"."key_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "rate_limits_attempts_check" CHECK ("rate_limits"."attempts" > 0),
	CONSTRAINT "rate_limits_expiry_check" CHECK ("rate_limits"."expires_at" > "rate_limits"."window_started_at")
);
--> statement-breakpoint
ALTER TABLE "rate_limits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "rate_limits_expiry_idx" ON "rate_limits" USING btree ("expires_at");