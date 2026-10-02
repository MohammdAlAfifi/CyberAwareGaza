import "server-only";

import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";

import {
  ASSESSMENT_CONTENT_VERSION,
  CONSENT_VERSION,
} from "@/src/assessment/content";
import type { SessionActor } from "@/src/auth/sessions";
import { db } from "@/src/db";
import { createParticipantRecordInTransaction } from "@/src/db/participant-identities";
import {
  adminAudit,
  assessmentAttempts,
  consents,
  contentVersions,
  importBatches,
  importRows,
  responses,
  rubricVersions,
} from "@/src/db/schema";
import {
  HistoricalCsvError,
  parseHistoricalCsv,
  type HistoricalCsvPreview,
  type ParsedImportRow,
} from "@/src/import/historical-csv";
import { calculateAssessmentScore } from "@/src/scoring/risk";
import {
  feedbackKeyFor,
  MAXIMUM_SCORE,
  MINIMUM_SCORE,
  RUBRIC_VERSION,
} from "@/src/scoring/rubric";

type AdminActor = Extract<SessionActor, { kind: "admin" }>;

export type StoredImportPreview = HistoricalCsvPreview & {
  batchId: string;
  filename: string;
  canConfirm: boolean;
};

export async function previewHistoricalImport(input: {
  actor: AdminActor;
  filename: string;
  bytes: Uint8Array;
}): Promise<StoredImportPreview> {
  const existing = await db
    .select({ key: assessmentAttempts.sourceSubmissionKey })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.source, "google_form"),
        isNotNull(assessmentAttempts.sourceSubmissionKey),
      ),
    );
  let preview = parseHistoricalCsv(
    input.bytes,
    new Set(existing.flatMap(({ key }) => (key ? [key] : []))),
  );
  const [identical] = await db
    .select({ id: importBatches.id })
    .from(importBatches)
    .where(
      and(
        eq(importBatches.checksum, preview.checksum),
        eq(importBatches.state, "committed"),
      ),
    )
    .limit(1);
  if (identical) preview = markAcceptedRowsDuplicate(preview);

  const filename = safeFilename(input.filename);
  const [batch] = await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(importBatches)
      .values({
        checksum: preview.checksum,
        originalFilename: filename,
        source: "google_form",
        state: identical ? "duplicate" : "previewed",
        totalRows: preview.counts.total,
        acceptedRows: preview.counts.accepted,
        excludedRows: preview.counts.excluded,
        invalidRows: preview.counts.invalid,
        duplicateRows: preview.counts.duplicate,
        importedAssessments: 0,
        createdByAccountId: input.actor.accountId,
        validationSummary: {
          timestampColumn: preview.columns.timestamp.header,
          consentColumn: preview.columns.consent.header,
          scenarioColumns: 8,
          hasTimestampWarnings: preview.rows.some(({ timestampWarning }) =>
            Boolean(timestampWarning),
          ),
        },
      })
      .returning({ id: importBatches.id });
    if (!created) throw new Error("Import preview could not be recorded.");
    if (preview.rows.length > 0) {
      await transaction.insert(importRows).values(
        preview.rows.map((row) => ({
          batchId: created.id,
          rowNumber: row.recordNumber,
          sourceRowKey:
            row.outcome === "accepted" || row.outcome === "duplicate"
              ? row.sourceRowKey
              : null,
          state: row.outcome,
          rejectionCode:
            row.outcome === "accepted" ? null : (row.problems[0]?.code ?? null),
          rejectionDetail:
            row.outcome === "accepted"
              ? null
              : (row.problems[0]?.detail ?? null),
        })),
      );
    }
    return [created];
  });

  return {
    ...preview,
    batchId: batch.id,
    filename,
    canConfirm: preview.counts.accepted > 0 && preview.counts.invalid === 0,
  };
}

export async function confirmHistoricalImport(input: {
  actor: AdminActor;
  batchId: string;
  bytes: Uint8Array;
  excludedInvalidRecords: readonly number[];
}) {
  const [stored] = await db
    .select()
    .from(importBatches)
    .where(eq(importBatches.id, input.batchId))
    .limit(1);
  if (!stored || stored.createdByAccountId !== input.actor.accountId) {
    throw new HistoricalCsvError(
      "Import preview was not found.",
      "preview_not_found",
    );
  }
  if (stored.state !== "previewed") {
    throw new HistoricalCsvError(
      "This preview can no longer be confirmed.",
      "preview_not_confirmable",
    );
  }

  const reparsed = parseHistoricalCsv(input.bytes);
  if (reparsed.checksum !== stored.checksum) {
    throw new HistoricalCsvError(
      "The selected file no longer matches the validated preview.",
      "preview_mismatch",
    );
  }
  const excluded = new Set(input.excludedInvalidRecords);
  const invalidRecords = reparsed.rows
    .filter(({ outcome }) => outcome === "invalid")
    .map(({ recordNumber }) => recordNumber);
  if (invalidRecords.some((record) => !excluded.has(record))) {
    throw new HistoricalCsvError(
      "Every invalid consenting row must be corrected or explicitly excluded.",
      "invalid_rows_unresolved",
    );
  }
  if ([...excluded].some((record) => !invalidRecords.includes(record))) {
    throw new HistoricalCsvError(
      "Only invalid rows may be explicitly excluded.",
      "invalid_exclusion_selection",
    );
  }

  const rows = reparsed.rows.map((row) =>
    excluded.has(row.recordNumber)
      ? {
          ...row,
          outcome: "excluded" as const,
          sourceRowKey: null,
          answers: [],
          problems: [
            {
              recordNumber: row.recordNumber,
              code: "admin_excluded_invalid",
              detail: "The administrator explicitly excluded this invalid row.",
            },
          ],
        }
      : row,
  );

  return db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtextextended(${stored.checksum}, 0))`,
    );
    const [lockedBatch] = await transaction
      .select({ state: importBatches.state })
      .from(importBatches)
      .where(eq(importBatches.id, input.batchId))
      .for("update")
      .limit(1);
    if (lockedBatch?.state !== "previewed") {
      throw new HistoricalCsvError(
        "This preview was already processed.",
        "preview_not_confirmable",
      );
    }

    const [identical] = await transaction
      .select({ id: importBatches.id })
      .from(importBatches)
      .where(
        and(
          eq(importBatches.checksum, stored.checksum),
          eq(importBatches.state, "committed"),
        ),
      )
      .limit(1);
    if (identical) {
      const duplicateRows = rows.filter(
        ({ outcome }) => outcome === "accepted" || outcome === "duplicate",
      ).length;
      await transaction
        .update(importBatches)
        .set({
          state: "duplicate",
          acceptedRows: 0,
          duplicateRows,
          excludedRows: rows.filter(({ outcome }) => outcome === "excluded")
            .length,
          invalidRows: rows.filter(({ outcome }) => outcome === "invalid")
            .length,
          importedAssessments: 0,
        })
        .where(eq(importBatches.id, input.batchId));
      return report(rows.length, 0, rows, duplicateRows, "duplicate" as const);
    }

    const candidateKeys = rows.flatMap((row) =>
      row.outcome === "accepted" && row.sourceRowKey ? [row.sourceRowKey] : [],
    );
    const existing = candidateKeys.length
      ? await transaction
          .select({ key: assessmentAttempts.sourceSubmissionKey })
          .from(assessmentAttempts)
          .where(inArray(assessmentAttempts.sourceSubmissionKey, candidateKeys))
      : [];
    const existingKeys = new Set(
      existing.flatMap(({ key }) => (key ? [key] : [])),
    );
    const effectiveRows = rows.map((row) =>
      row.outcome === "accepted" &&
      row.sourceRowKey &&
      existingKeys.has(row.sourceRowKey)
        ? {
            ...row,
            outcome: "duplicate" as const,
            problems: [
              {
                recordNumber: row.recordNumber,
                code: "duplicate_source_response",
                detail:
                  "This source response was imported concurrently or earlier.",
              },
            ],
          }
        : row,
    );

    const [version] = await transaction
      .select({
        contentId: contentVersions.id,
        rubricId: rubricVersions.id,
        minimumScore: rubricVersions.minimumScore,
        maximumScore: rubricVersions.maximumScore,
      })
      .from(contentVersions)
      .innerJoin(
        rubricVersions,
        eq(rubricVersions.contentVersionId, contentVersions.id),
      )
      .where(
        and(
          eq(contentVersions.id, ASSESSMENT_CONTENT_VERSION),
          eq(contentVersions.isActive, true),
          eq(rubricVersions.id, RUBRIC_VERSION),
          eq(rubricVersions.isActive, true),
        ),
      )
      .limit(1);
    if (
      !version ||
      version.minimumScore !== MINIMUM_SCORE ||
      version.maximumScore !== MAXIMUM_SCORE
    ) {
      throw new HistoricalCsvError(
        "The approved content and scoring version is unavailable.",
        "scoring_unavailable",
      );
    }

    let importedAssessments = 0;
    for (const row of effectiveRows) {
      if (row.outcome !== "accepted") continue;
      const sourceKey =
        row.sourceRowKey ?? `${stored.checksum}:record:${row.recordNumber}`;
      const participant = await createParticipantRecordInTransaction(
        transaction,
        {
          type: "imported",
          sourceParticipantKey: sourceKey,
          importBatchId: input.batchId,
          sourceRecordNumber: row.recordNumber,
        },
      );
      const score = calculateAssessmentScore(row.answers);
      const [attempt] = await transaction
        .insert(assessmentAttempts)
        .values({
          participantId: participant.id,
          status: "completed",
          source: "google_form",
          sourceSubmissionKey: sourceKey,
          sourceSubmittedAt: row.sourceSubmittedAt,
          importBatchId: input.batchId,
          sourceRecordNumber: row.recordNumber,
          contentVersionId: version.contentId,
          rubricVersionId: version.rubricId,
          totalScore: score.totalScore,
          risk: score.risk,
          completedAt: row.sourceSubmittedAt,
          updatedAt: sql`now()`,
        })
        .returning({ id: assessmentAttempts.id });
      if (!attempt) throw new Error("Assessment creation returned no record.");

      await transaction.insert(consents).values({
        participantId: participant.id,
        attemptId: attempt.id,
        decision: true,
        consentVersion: CONSENT_VERSION,
        source: "google_form",
        decidedAt: row.sourceSubmittedAt ?? sql`now()`,
      });
      await transaction.insert(responses).values(
        row.answers.map((answer) => ({
          attemptId: attempt.id,
          contentVersionId: version.contentId,
          scenarioKey: answer.scenarioKey,
          selectedOptionId: answer.optionId,
          contribution: score.contributions.get(answer.scenarioKey)!,
          feedbackKey: feedbackKeyFor(score.rules.get(answer.scenarioKey)!),
        })),
      );
      await transaction
        .update(importRows)
        .set({ participantId: participant.id, attemptId: attempt.id })
        .where(
          and(
            eq(importRows.batchId, input.batchId),
            eq(importRows.rowNumber, row.recordNumber),
          ),
        );
      importedAssessments += 1;
    }

    for (const row of effectiveRows) {
      await transaction
        .update(importRows)
        .set({
          state: row.outcome,
          sourceRowKey:
            row.outcome === "accepted" || row.outcome === "duplicate"
              ? row.sourceRowKey
              : null,
          rejectionCode:
            row.outcome === "accepted" ? null : row.problems[0]?.code,
          rejectionDetail:
            row.outcome === "accepted" ? null : row.problems[0]?.detail,
        })
        .where(
          and(
            eq(importRows.batchId, input.batchId),
            eq(importRows.rowNumber, row.recordNumber),
          ),
        );
    }

    const counts = countRows(effectiveRows);
    await transaction
      .update(importBatches)
      .set({
        state: "committed",
        acceptedRows: counts.accepted,
        excludedRows: counts.excluded,
        invalidRows: counts.invalid,
        duplicateRows: counts.duplicate,
        importedAssessments,
        committedAt: sql`now()`,
      })
      .where(eq(importBatches.id, input.batchId));
    await transaction.insert(adminAudit).values({
      actorAccountId: input.actor.accountId,
      action: "historical_csv_import_committed",
      metadata: {
        batchId: input.batchId,
        source: "google_form",
        totalRows: effectiveRows.length,
        importedAssessments,
        excludedRows: counts.excluded,
        duplicateRows: counts.duplicate,
      },
    });
    return report(
      effectiveRows.length,
      importedAssessments,
      effectiveRows,
      counts.duplicate,
      "committed" as const,
    );
  });
}

function safeFilename(value: string) {
  const leaf = value
    .split(/[\\/]/)
    .at(-1)
    ?.replace(/[\u0000-\u001f\u007f]/g, "")
    .trim();
  return (leaf || "historical-responses.csv").slice(0, 255);
}

function countRows(rows: readonly ParsedImportRow[]) {
  return {
    accepted: rows.filter(({ outcome }) => outcome === "accepted").length,
    excluded: rows.filter(({ outcome }) => outcome === "excluded").length,
    invalid: rows.filter(({ outcome }) => outcome === "invalid").length,
    duplicate: rows.filter(({ outcome }) => outcome === "duplicate").length,
  };
}

function markAcceptedRowsDuplicate(
  preview: HistoricalCsvPreview,
): HistoricalCsvPreview {
  const rows = preview.rows.map((row) =>
    row.outcome === "accepted"
      ? {
          ...row,
          outcome: "duplicate" as const,
          problems: [
            {
              recordNumber: row.recordNumber,
              code: "duplicate_file",
              detail: "This exact file was already committed.",
            },
          ],
        }
      : row,
  );
  return {
    ...preview,
    rows,
    counts: { total: rows.length, ...countRows(rows) },
  };
}

function report(
  totalRows: number,
  importedAssessments: number,
  rows: readonly ParsedImportRow[],
  duplicateRows: number,
  state: "committed" | "duplicate",
) {
  const counts = countRows(rows);
  return {
    state,
    totalRows,
    acceptedRows: counts.accepted,
    excludedRows: counts.excluded,
    invalidRows: counts.invalid,
    duplicateRows,
    importedAssessments,
    participantsCreated: importedAssessments,
    responsesCreated: importedAssessments * 8,
  };
}
