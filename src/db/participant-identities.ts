import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/src/db";
import { counters, participants } from "@/src/db/schema";
import { formatParticipantCode } from "@/src/participants/identifiers";

const counterKeys = {
  participant: "participant_public_code",
  anonymous: "anonymous_ordinal",
} as const;

type ParticipantCreation =
  | { type: "registered"; accountId: string }
  | { type: "anonymous" }
  | {
      type: "imported";
      sourceParticipantKey: string;
      importBatchId: string;
      sourceRecordNumber: number;
    };

type DatabaseTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export async function createParticipantRecord(input: ParticipantCreation) {
  return db.transaction((transaction) =>
    createParticipantRecordInTransaction(transaction, input),
  );
}

export async function createParticipantRecordInTransaction(
  transaction: DatabaseTransaction,
  input: ParticipantCreation,
) {
  const publicOrdinal = await nextCounterValue(
    transaction,
    counterKeys.participant,
  );
  const anonymousOrdinal =
    input.type === "anonymous" || input.type === "imported"
      ? await nextCounterValue(transaction, counterKeys.anonymous)
      : null;

  const [participant] = await transaction
    .insert(participants)
    .values({
      publicCode: formatParticipantCode(publicOrdinal),
      type: input.type,
      source: input.type === "imported" ? "google_form" : "web",
      accountId: input.type === "registered" ? input.accountId : null,
      anonymousOrdinal,
      sourceParticipantKey:
        input.type === "imported" ? input.sourceParticipantKey : null,
      importBatchId: input.type === "imported" ? input.importBatchId : null,
      sourceRecordNumber:
        input.type === "imported" ? input.sourceRecordNumber : null,
    })
    .returning();

  if (!participant) throw new Error("Participant creation returned no record");
  return participant;
}

async function nextCounterValue(
  transaction: DatabaseTransaction,
  key: string,
): Promise<number> {
  const [counter] = await transaction
    .insert(counters)
    .values({ key, value: 1 })
    .onConflictDoUpdate({
      target: counters.key,
      set: { value: sql`${counters.value} + 1` },
    })
    .returning({ value: counters.value });

  if (!counter) throw new Error(`Counter allocation failed for ${key}`);
  return counter.value;
}
