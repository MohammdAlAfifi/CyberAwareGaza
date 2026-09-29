import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const accountRole = pgEnum("account_role", ["participant", "admin"]);
export const participantType = pgEnum("participant_type", [
  "registered",
  "anonymous",
  "imported",
]);
export const collectionSource = pgEnum("collection_source", [
  "web",
  "google_form",
]);
export const attemptStatus = pgEnum("attempt_status", [
  "in_progress",
  "completed",
  "abandoned",
  "excluded",
]);
export const riskCategory = pgEnum("risk_category", ["low", "medium", "high"]);
export const sessionKind = pgEnum("session_kind", ["account", "anonymous"]);
export const importState = pgEnum("import_state", [
  "previewed",
  "committed",
  "failed",
]);
export const importRowState = pgEnum("import_row_state", [
  "accepted",
  "excluded",
  "duplicate",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    normalizedUsername: varchar("normalized_username", {
      length: 80,
    }).notNull(),
    username: varchar("username", { length: 80 }).notNull(),
    displayName: varchar("display_name", { length: 120 }),
    passwordHash: text("password_hash").notNull(),
    role: accountRole("role").notNull().default("participant"),
    language: varchar("language", { length: 2 }).notNull().default("en"),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...timestamps,
  },
  (table) => [
    unique("accounts_normalized_username_unique").on(table.normalizedUsername),
    check("accounts_language_check", sql`${table.language} in ('en', 'ar')`),
    check(
      "accounts_username_check",
      sql`char_length(btrim(${table.username})) between 3 and 80`,
    ),
    check(
      "accounts_normalized_username_check",
      sql`char_length(btrim(${table.normalizedUsername})) between 3 and 80 and ${table.normalizedUsername} = lower(${table.normalizedUsername})`,
    ),
    check(
      "accounts_display_name_check",
      sql`${table.displayName} is null or char_length(btrim(${table.displayName})) between 1 and 120`,
    ),
    check(
      "accounts_password_hash_check",
      sql`char_length(${table.passwordHash}) > 0`,
    ),
  ],
).enableRLS();

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicCode: varchar("public_code", { length: 24 }).notNull(),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "restrict",
    }),
    type: participantType("type").notNull(),
    anonymousOrdinal: integer("anonymous_ordinal"),
    source: collectionSource("source").notNull(),
    sourceParticipantKey: varchar("source_participant_key", { length: 160 }),
    ...timestamps,
  },
  (table) => [
    unique("participants_public_code_unique").on(table.publicCode),
    unique("participants_account_unique").on(table.accountId),
    unique("participants_anonymous_ordinal_unique").on(table.anonymousOrdinal),
    unique("participants_source_key_unique").on(
      table.source,
      table.sourceParticipantKey,
    ),
    index("participants_type_created_idx").on(table.type, table.createdAt),
    index("participants_source_created_idx").on(table.source, table.createdAt),
    check(
      "participants_public_code_check",
      sql`${table.publicCode} ~ '^CAG-[0-9]{4,}$'`,
    ),
    check(
      "participants_anonymous_ordinal_check",
      sql`${table.anonymousOrdinal} is null or ${table.anonymousOrdinal} > 0`,
    ),
    check(
      "participants_shape_check",
      sql`(${table.type} = 'registered' and ${table.accountId} is not null and ${table.anonymousOrdinal} is null)
        or (${table.type} = 'anonymous' and ${table.accountId} is null and ${table.anonymousOrdinal} is not null)
        or (${table.type} = 'imported' and ${table.accountId} is null and ${table.anonymousOrdinal} is null)`,
    ),
    check(
      "participants_source_shape_check",
      sql`(${table.type} in ('registered', 'anonymous') and ${table.source} = 'web' and ${table.sourceParticipantKey} is null)
        or (${table.type} = 'imported' and ${table.source} = 'google_form' and ${table.sourceParticipantKey} is not null)`,
    ),
  ],
).enableRLS();

export const contentVersions = pgTable(
  "content_versions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    label: varchar("label", { length: 120 }).notNull(),
    isActive: boolean("is_active").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("content_versions_one_active_idx")
      .on(table.isActive)
      .where(sql`${table.isActive}`),
    check(
      "content_versions_id_check",
      sql`char_length(btrim(${table.id})) > 0`,
    ),
    check(
      "content_versions_label_check",
      sql`char_length(btrim(${table.label})) > 0`,
    ),
    check(
      "content_versions_approval_check",
      sql`not ${table.isActive} or ${table.approvedAt} is not null`,
    ),
  ],
).enableRLS();

export const rubricVersions = pgTable(
  "rubric_versions",
  {
    id: varchar("id", { length: 64 }).primaryKey(),
    contentVersionId: varchar("content_version_id", { length: 64 })
      .notNull()
      .references(() => contentVersions.id, { onDelete: "restrict" }),
    label: varchar("label", { length: 120 }).notNull(),
    isActive: boolean("is_active").notNull().default(false),
    minimumScore: integer("minimum_score"),
    maximumScore: integer("maximum_score"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("rubric_versions_id_content_unique").on(
      table.id,
      table.contentVersionId,
    ),
    uniqueIndex("rubric_versions_one_active_idx")
      .on(table.isActive)
      .where(sql`${table.isActive}`),
    check("rubric_versions_id_check", sql`char_length(btrim(${table.id})) > 0`),
    check(
      "rubric_versions_label_check",
      sql`char_length(btrim(${table.label})) > 0`,
    ),
    check(
      "rubric_versions_score_range_check",
      sql`(${table.minimumScore} is null and ${table.maximumScore} is null)
        or (${table.minimumScore} is not null and ${table.maximumScore} is not null and ${table.minimumScore} <= ${table.maximumScore})`,
    ),
    check(
      "rubric_versions_approval_check",
      sql`not ${table.isActive} or (${table.approvedAt} is not null and ${table.minimumScore} is not null and ${table.maximumScore} is not null)`,
    ),
  ],
).enableRLS();

export const scenarios = pgTable(
  "scenarios",
  {
    contentVersionId: varchar("content_version_id", { length: 64 })
      .notNull()
      .references(() => contentVersions.id, { onDelete: "restrict" }),
    key: varchar("key", { length: 2 }).notNull(),
    displayOrder: integer("display_order").notNull(),
    questionEn: text("question_en").notNull(),
    questionAr: text("question_ar").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.contentVersionId, table.key] }),
    unique("scenarios_version_order_unique").on(
      table.contentVersionId,
      table.displayOrder,
    ),
    check(
      "scenarios_key_check",
      sql`${table.key} in ('S1','S2','S3','S4','S5','S6','S7','S8')`,
    ),
    check("scenarios_order_check", sql`${table.displayOrder} between 1 and 8`),
    check(
      "scenarios_key_order_check",
      sql`${table.displayOrder} = substring(${table.key} from 2)::integer`,
    ),
    check(
      "scenarios_text_check",
      sql`char_length(btrim(${table.questionEn})) > 0 and char_length(btrim(${table.questionAr})) > 0`,
    ),
  ],
).enableRLS();

export const options = pgTable(
  "options",
  {
    contentVersionId: varchar("content_version_id", { length: 64 }).notNull(),
    scenarioKey: varchar("scenario_key", { length: 2 }).notNull(),
    id: varchar("id", { length: 48 }).notNull(),
    displayOrder: integer("display_order").notNull(),
    textEn: text("text_en").notNull(),
    textAr: text("text_ar").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.contentVersionId, table.scenarioKey, table.id],
    }),
    foreignKey({
      columns: [table.contentVersionId, table.scenarioKey],
      foreignColumns: [scenarios.contentVersionId, scenarios.key],
      name: "options_scenario_fk",
    }).onDelete("restrict"),
    unique("options_version_scenario_order_unique").on(
      table.contentVersionId,
      table.scenarioKey,
      table.displayOrder,
    ),
    check("options_id_check", sql`char_length(btrim(${table.id})) > 0`),
    check("options_order_check", sql`${table.displayOrder} > 0`),
    check(
      "options_text_check",
      sql`char_length(btrim(${table.textEn})) > 0 and char_length(btrim(${table.textAr})) > 0`,
    ),
  ],
).enableRLS();

export const rubricEntries = pgTable(
  "rubric_entries",
  {
    rubricVersionId: varchar("rubric_version_id", { length: 64 })
      .notNull()
      .references(() => rubricVersions.id, { onDelete: "restrict" }),
    contentVersionId: varchar("content_version_id", { length: 64 })
      .notNull()
      .references(() => contentVersions.id, { onDelete: "restrict" }),
    scenarioKey: varchar("scenario_key", { length: 2 }).notNull(),
    optionId: varchar("option_id", { length: 48 }).notNull(),
    contribution: integer("contribution").notNull(),
    feedbackEn: text("feedback_en"),
    feedbackAr: text("feedback_ar"),
  },
  (table) => [
    primaryKey({
      columns: [table.rubricVersionId, table.scenarioKey, table.optionId],
    }),
    foreignKey({
      columns: [table.rubricVersionId, table.contentVersionId],
      foreignColumns: [rubricVersions.id, rubricVersions.contentVersionId],
      name: "rubric_entries_version_content_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.contentVersionId, table.scenarioKey, table.optionId],
      foreignColumns: [
        options.contentVersionId,
        options.scenarioKey,
        options.id,
      ],
      name: "rubric_entries_option_fk",
    }).onDelete("restrict"),
    check(
      "rubric_entries_scenario_key_check",
      sql`${table.scenarioKey} in ('S1','S2','S3','S4','S5','S6','S7','S8')`,
    ),
  ],
).enableRLS();

export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "restrict" }),
    status: attemptStatus("status").notNull().default("in_progress"),
    source: collectionSource("source").notNull(),
    sourceSubmissionKey: varchar("source_submission_key", { length: 200 }),
    idempotencyKey: uuid("idempotency_key"),
    contentVersionId: varchar("content_version_id", { length: 64 }).references(
      () => contentVersions.id,
      { onDelete: "restrict" },
    ),
    rubricVersionId: varchar("rubric_version_id", { length: 64 }),
    totalScore: integer("total_score"),
    risk: riskCategory("risk"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("attempts_id_participant_unique").on(table.id, table.participantId),
    unique("attempts_id_content_unique").on(table.id, table.contentVersionId),
    foreignKey({
      columns: [table.rubricVersionId, table.contentVersionId],
      foreignColumns: [rubricVersions.id, rubricVersions.contentVersionId],
      name: "attempts_rubric_content_fk",
    }).onDelete("restrict"),
    unique("attempts_source_submission_unique").on(
      table.source,
      table.sourceSubmissionKey,
    ),
    unique("attempts_participant_idempotency_unique").on(
      table.participantId,
      table.idempotencyKey,
    ),
    index("attempts_participant_completed_idx").on(
      table.participantId,
      table.completedAt,
    ),
    index("attempts_source_status_idx").on(table.source, table.status),
    index("attempts_status_updated_idx").on(table.status, table.updatedAt),
    check(
      "attempts_source_shape_check",
      sql`(${table.source} = 'web' and ${table.sourceSubmissionKey} is null)
        or (${table.source} = 'google_form' and ${table.sourceSubmissionKey} is not null)`,
    ),
    check(
      "attempts_completion_shape_check",
      sql`(${table.status} = 'completed' and ${table.contentVersionId} is not null and ${table.rubricVersionId} is not null and ${table.totalScore} is not null and ${table.risk} is not null and ${table.completedAt} is not null)
        or (${table.status} <> 'completed' and ${table.completedAt} is null)`,
    ),
  ],
).enableRLS();

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id, { onDelete: "restrict" }),
    attemptId: uuid("attempt_id"),
    decision: boolean("decision").notNull(),
    consentVersion: varchar("consent_version", { length: 64 }).notNull(),
    source: collectionSource("source").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.attemptId, table.participantId],
      foreignColumns: [assessmentAttempts.id, assessmentAttempts.participantId],
      name: "consents_attempt_participant_fk",
    }).onDelete("restrict"),
    unique("consents_attempt_unique").on(table.attemptId),
    index("consents_participant_decided_idx").on(
      table.participantId,
      table.decidedAt,
    ),
    check(
      "consents_version_check",
      sql`char_length(btrim(${table.consentVersion})) > 0`,
    ),
  ],
).enableRLS();

export const responses = pgTable(
  "responses",
  {
    attemptId: uuid("attempt_id").notNull(),
    contentVersionId: varchar("content_version_id", { length: 64 }).notNull(),
    scenarioKey: varchar("scenario_key", { length: 2 }).notNull(),
    selectedOptionId: varchar("selected_option_id", { length: 48 }).notNull(),
    contribution: integer("contribution").notNull(),
    feedbackKey: varchar("feedback_key", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.attemptId, table.scenarioKey] }),
    foreignKey({
      columns: [table.attemptId, table.contentVersionId],
      foreignColumns: [
        assessmentAttempts.id,
        assessmentAttempts.contentVersionId,
      ],
      name: "responses_attempt_content_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [
        table.contentVersionId,
        table.scenarioKey,
        table.selectedOptionId,
      ],
      foreignColumns: [
        options.contentVersionId,
        options.scenarioKey,
        options.id,
      ],
      name: "responses_selected_option_fk",
    }).onDelete("restrict"),
    check(
      "responses_scenario_key_check",
      sql`${table.scenarioKey} in ('S1','S2','S3','S4','S5','S6','S7','S8')`,
    ),
  ],
).enableRLS();

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    kind: sessionKind("kind").notNull(),
    accountId: uuid("account_id").references(() => accounts.id, {
      onDelete: "cascade",
    }),
    participantId: uuid("participant_id").references(() => participants.id, {
      onDelete: "cascade",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_expiry_idx").on(table.expiresAt),
    check(
      "sessions_actor_check",
      sql`(${table.kind} = 'account' and ${table.accountId} is not null)
        or (${table.kind} = 'anonymous' and ${table.accountId} is null and ${table.participantId} is not null)`,
    ),
    check(
      "sessions_token_hash_check",
      sql`${table.tokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "sessions_expiry_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "sessions_revocation_check",
      sql`${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt}`,
    ),
  ],
).enableRLS();

export const counters = pgTable(
  "counters",
  {
    key: varchar("key", { length: 40 }).primaryKey(),
    value: integer("value").notNull().default(0),
  },
  (table) => [
    check("counters_key_check", sql`char_length(btrim(${table.key})) > 0`),
    check("counters_value_check", sql`${table.value} >= 0`),
  ],
).enableRLS();

export const rateLimits = pgTable(
  "rate_limits",
  {
    bucket: varchar("bucket", { length: 40 }).notNull(),
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    attempts: integer("attempts").notNull().default(1),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.bucket, table.keyHash] }),
    index("rate_limits_expiry_idx").on(table.expiresAt),
    check(
      "rate_limits_bucket_check",
      sql`char_length(btrim(${table.bucket})) > 0`,
    ),
    check(
      "rate_limits_key_hash_check",
      sql`${table.keyHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check("rate_limits_attempts_check", sql`${table.attempts} > 0`),
    check(
      "rate_limits_expiry_check",
      sql`${table.expiresAt} > ${table.windowStartedAt}`,
    ),
  ],
).enableRLS();

export const importBatches = pgTable(
  "import_batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    checksum: varchar("checksum", { length: 64 }).notNull(),
    originalFilename: varchar("original_filename", { length: 255 }).notNull(),
    state: importState("state").notNull(),
    totalRows: integer("total_rows").notNull().default(0),
    acceptedRows: integer("accepted_rows").notNull().default(0),
    excludedRows: integer("excluded_rows").notNull().default(0),
    duplicateRows: integer("duplicate_rows").notNull().default(0),
    createdByAccountId: uuid("created_by_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    committedAt: timestamp("committed_at", { withTimezone: true }),
  },
  (table) => [
    unique("import_batches_checksum_unique").on(table.checksum),
    index("import_batches_state_created_idx").on(table.state, table.createdAt),
    check(
      "import_batches_checksum_check",
      sql`${table.checksum} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "import_batches_filename_check",
      sql`char_length(btrim(${table.originalFilename})) between 1 and 255`,
    ),
    check(
      "import_batches_counts_check",
      sql`${table.totalRows} >= 0 and ${table.acceptedRows} >= 0 and ${table.excludedRows} >= 0 and ${table.duplicateRows} >= 0
        and (${table.acceptedRows} + ${table.excludedRows} + ${table.duplicateRows}) <= ${table.totalRows}`,
    ),
    check(
      "import_batches_commit_shape_check",
      sql`(${table.state} = 'committed' and ${table.committedAt} is not null)
        or (${table.state} <> 'committed' and ${table.committedAt} is null)`,
    ),
  ],
).enableRLS();

export const importRows = pgTable(
  "import_rows",
  {
    batchId: uuid("batch_id")
      .notNull()
      .references(() => importBatches.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    sourceRowKey: varchar("source_row_key", { length: 200 }),
    state: importRowState("state").notNull(),
    rejectionCode: varchar("rejection_code", { length: 80 }),
    rejectionDetail: text("rejection_detail"),
  },
  (table) => [
    primaryKey({ columns: [table.batchId, table.rowNumber] }),
    unique("import_rows_batch_source_key_unique").on(
      table.batchId,
      table.sourceRowKey,
    ),
    index("import_rows_batch_state_idx").on(table.batchId, table.state),
    check("import_rows_row_number_check", sql`${table.rowNumber} > 0`),
    check(
      "import_rows_rejection_shape_check",
      sql`(${table.state} = 'excluded' and ${table.rejectionCode} is not null)
        or (${table.state} <> 'excluded' and ${table.rejectionCode} is null and ${table.rejectionDetail} is null)`,
    ),
  ],
).enableRLS();

export const adminAudit = pgTable(
  "admin_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorAccountId: uuid("actor_account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 100 }).notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, string | number | boolean | null>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_audit_actor_created_idx").on(
      table.actorAccountId,
      table.createdAt,
    ),
    index("admin_audit_action_created_idx").on(table.action, table.createdAt),
    check(
      "admin_audit_action_check",
      sql`char_length(btrim(${table.action})) > 0`,
    ),
  ],
).enableRLS();
