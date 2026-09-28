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
  uuid,
  varchar
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const accountRole = pgEnum("account_role", ["participant", "admin"]);
export const participantType = pgEnum("participant_type", ["registered", "anonymous", "imported"]);
export const collectionSource = pgEnum("collection_source", ["web", "google_form"]);
export const attemptStatus = pgEnum("attempt_status", ["in_progress", "completed", "abandoned", "excluded"]);
export const riskCategory = pgEnum("risk_category", ["low", "medium", "high"]);
export const sessionKind = pgEnum("session_kind", ["account", "anonymous"]);
export const importState = pgEnum("import_state", ["previewed", "committed", "failed"]);
export const importRowState = pgEnum("import_row_state", ["accepted", "excluded", "duplicate"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
};

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    normalizedUsername: varchar("normalized_username", { length: 80 }).notNull(),
    username: varchar("username", { length: 80 }).notNull(),
    displayName: varchar("display_name", { length: 120 }),
    passwordHash: text("password_hash").notNull(),
    role: accountRole("role").notNull().default("participant"),
    language: varchar("language", { length: 2 }).notNull().default("en"),
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }).notNull().defaultNow(),
    ...timestamps
  },
  (table) => [
    unique("accounts_normalized_username_unique").on(table.normalizedUsername),
    check("accounts_language_check", sql`${table.language} in ('en', 'ar')`)
  ]
);

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    publicCode: varchar("public_code", { length: 24 }).notNull(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "restrict" }),
    type: participantType("type").notNull(),
    anonymousOrdinal: integer("anonymous_ordinal"),
    source: collectionSource("source").notNull(),
    sourceParticipantKey: varchar("source_participant_key", { length: 160 }),
    ...timestamps
  },
  (table) => [
    unique("participants_public_code_unique").on(table.publicCode),
    unique("participants_account_unique").on(table.accountId),
    unique("participants_anonymous_ordinal_unique").on(table.anonymousOrdinal),
    unique("participants_source_key_unique").on(table.source, table.sourceParticipantKey),
    check(
      "participants_shape_check",
      sql`(${table.type} = 'registered' and ${table.accountId} is not null and ${table.anonymousOrdinal} is null)
        or (${table.type} = 'anonymous' and ${table.accountId} is null and ${table.anonymousOrdinal} is not null)
        or (${table.type} = 'imported' and ${table.accountId} is null)`
    )
  ]
);

export const contentVersions = pgTable("content_versions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(false),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const rubricVersions = pgTable("rubric_versions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  isActive: boolean("is_active").notNull().default(false),
  minimumScore: integer("minimum_score"),
  maximumScore: integer("maximum_score"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
});

export const scenarios = pgTable(
  "scenarios",
  {
    contentVersionId: varchar("content_version_id", { length: 64 })
      .notNull()
      .references(() => contentVersions.id, { onDelete: "restrict" }),
    key: varchar("key", { length: 2 }).notNull(),
    displayOrder: integer("display_order").notNull(),
    questionEn: text("question_en").notNull(),
    questionAr: text("question_ar").notNull()
  },
  (table) => [
    primaryKey({ columns: [table.contentVersionId, table.key] }),
    unique("scenarios_version_order_unique").on(table.contentVersionId, table.displayOrder),
    check("scenarios_key_check", sql`${table.key} in ('S1','S2','S3','S4','S5','S6','S7','S8')`),
    check("scenarios_order_check", sql`${table.displayOrder} between 1 and 8`)
  ]
);

export const options = pgTable(
  "options",
  {
    contentVersionId: varchar("content_version_id", { length: 64 }).notNull(),
    scenarioKey: varchar("scenario_key", { length: 2 }).notNull(),
    id: varchar("id", { length: 48 }).notNull(),
    displayOrder: integer("display_order").notNull(),
    textEn: text("text_en").notNull(),
    textAr: text("text_ar").notNull()
  },
  (table) => [
    primaryKey({ columns: [table.contentVersionId, table.scenarioKey, table.id] }),
    foreignKey({
      columns: [table.contentVersionId, table.scenarioKey],
      foreignColumns: [scenarios.contentVersionId, scenarios.key],
      name: "options_scenario_fk"
    }).onDelete("restrict"),
    unique("options_version_scenario_order_unique").on(
      table.contentVersionId,
      table.scenarioKey,
      table.displayOrder
    )
  ]
);

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
    feedbackAr: text("feedback_ar")
  },
  (table) => [
    primaryKey({ columns: [table.rubricVersionId, table.scenarioKey, table.optionId] }),
    foreignKey({
      columns: [table.contentVersionId, table.scenarioKey, table.optionId],
      foreignColumns: [options.contentVersionId, options.scenarioKey, options.id],
      name: "rubric_entries_option_fk"
    }).onDelete("restrict")
  ]
);

export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id").notNull().references(() => participants.id, { onDelete: "restrict" }),
    status: attemptStatus("status").notNull().default("in_progress"),
    source: collectionSource("source").notNull(),
    sourceSubmissionKey: varchar("source_submission_key", { length: 200 }),
    idempotencyKey: uuid("idempotency_key"),
    contentVersionId: varchar("content_version_id", { length: 64 }).references(() => contentVersions.id, { onDelete: "restrict" }),
    rubricVersionId: varchar("rubric_version_id", { length: 64 }).references(() => rubricVersions.id, { onDelete: "restrict" }),
    totalScore: integer("total_score"),
    risk: riskCategory("risk"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique("attempts_source_submission_unique").on(table.source, table.sourceSubmissionKey),
    unique("attempts_participant_idempotency_unique").on(table.participantId, table.idempotencyKey),
    index("attempts_participant_completed_idx").on(table.participantId, table.completedAt),
    index("attempts_source_status_idx").on(table.source, table.status)
  ]
);

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    participantId: uuid("participant_id").notNull().references(() => participants.id, { onDelete: "restrict" }),
    attemptId: uuid("attempt_id").references(() => assessmentAttempts.id, { onDelete: "restrict" }),
    decision: boolean("decision").notNull(),
    consentVersion: varchar("consent_version", { length: 64 }).notNull(),
    source: collectionSource("source").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("consents_participant_decided_idx").on(table.participantId, table.decidedAt)]
);

export const responses = pgTable(
  "responses",
  {
    attemptId: uuid("attempt_id").notNull().references(() => assessmentAttempts.id, { onDelete: "restrict" }),
    scenarioKey: varchar("scenario_key", { length: 2 }).notNull(),
    selectedOptionId: varchar("selected_option_id", { length: 48 }).notNull(),
    contribution: integer("contribution").notNull(),
    feedbackKey: varchar("feedback_key", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    primaryKey({ columns: [table.attemptId, table.scenarioKey] }),
    check("responses_scenario_key_check", sql`${table.scenarioKey} in ('S1','S2','S3','S4','S5','S6','S7','S8')`)
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    kind: sessionKind("kind").notNull(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "cascade" }),
    participantId: uuid("participant_id").references(() => participants.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [
    unique("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_expiry_idx").on(table.expiresAt),
    check(
      "sessions_actor_check",
      sql`(${table.kind} = 'account' and ${table.accountId} is not null)
        or (${table.kind} = 'anonymous' and ${table.accountId} is null and ${table.participantId} is not null)`
    )
  ]
);

export const counters = pgTable("counters", {
  key: varchar("key", { length: 40 }).primaryKey(),
  value: integer("value").notNull().default(0)
});

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
    createdByAccountId: uuid("created_by_account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    committedAt: timestamp("committed_at", { withTimezone: true })
  },
  (table) => [unique("import_batches_checksum_unique").on(table.checksum)]
);

export const importRows = pgTable(
  "import_rows",
  {
    batchId: uuid("batch_id").notNull().references(() => importBatches.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    sourceRowKey: varchar("source_row_key", { length: 200 }),
    state: importRowState("state").notNull(),
    rejectionCode: varchar("rejection_code", { length: 80 }),
    rejectionDetail: text("rejection_detail")
  },
  (table) => [primaryKey({ columns: [table.batchId, table.rowNumber] })]
);

export const adminAudit = pgTable(
  "admin_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorAccountId: uuid("actor_account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
    action: varchar("action", { length: 100 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => [index("admin_audit_actor_created_idx").on(table.actorAccountId, table.createdAt)]
);
