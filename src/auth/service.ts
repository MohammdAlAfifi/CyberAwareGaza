import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { AuthError } from "@/src/auth/errors";
import { hashPassword, verifyPassword } from "@/src/auth/password";
import { clearRateLimit, consumeRateLimit } from "@/src/auth/rate-limit";
import { createAccountSession, sessionTokenHash } from "@/src/auth/sessions";
import { createOpaqueToken } from "@/src/auth/crypto";
import { db } from "@/src/db";
import { createParticipantRecordInTransaction } from "@/src/db/participant-identities";
import { accounts, participants, sessions } from "@/src/db/schema";
import { env } from "@/src/lib/env";
import { normalizeUsername } from "@/src/lib/username";

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$Q3liZXJBd2FyZUdha2E$Hx/mamLPr0WSrCmseVg69iEj53Hfl8vMztNFxbj1Ozg";

type SignupInput = {
  username: string;
  displayName: string | null;
  password: string;
  locale: "en" | "ar";
  clientAddress: string;
  previousToken?: string;
};

export async function signupParticipant(input: SignupInput) {
  const normalizedUsername = normalizeUsername(input.username);
  await consumeRateLimit("signup", input.clientAddress);
  const passwordHash = await hashPassword(input.password);

  let accountId: string;
  let participantId: string;
  try {
    const created = await db.transaction(async (transaction) => {
      const [account] = await transaction
        .insert(accounts)
        .values({
          normalizedUsername,
          username: input.username.trim().normalize("NFKC"),
          displayName: input.displayName,
          passwordHash,
          role: "participant",
          language: input.locale,
        })
        .returning({ id: accounts.id });
      if (!account) throw new Error("Account creation returned no record");
      const participant = await createParticipantRecordInTransaction(
        transaction,
        { type: "registered", accountId: account.id },
      );
      return { accountId: account.id, participantId: participant.id };
    });
    accountId = created.accountId;
    participantId = created.participantId;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AuthError("signup_unavailable", 409);
    }
    throw error;
  }

  return createAccountSession({
    accountId,
    participantId,
    previousToken: input.previousToken,
  });
}

type LoginInput = {
  username: string;
  password: string;
  expectedRole: "participant" | "admin";
  clientAddress: string;
  previousToken?: string;
};

export async function loginAccount(input: LoginInput) {
  const normalizedUsername = normalizeUsername(input.username);
  const bucket = input.expectedRole === "admin" ? "adminLogin" : "login";
  const identifier = `${input.clientAddress}:${normalizedUsername}`;
  await consumeRateLimit(
    input.expectedRole === "admin" ? "adminLoginIp" : "loginIp",
    input.clientAddress,
  );
  await consumeRateLimit(bucket, identifier);

  const [account] = await db
    .select({
      id: accounts.id,
      passwordHash: accounts.passwordHash,
      role: accounts.role,
    })
    .from(accounts)
    .where(eq(accounts.normalizedUsername, normalizedUsername))
    .limit(1);
  const validPassword = await verifyPassword(
    account?.passwordHash ?? DUMMY_PASSWORD_HASH,
    input.password,
  ).catch(() => false);

  if (!account || !validPassword || account.role !== input.expectedRole) {
    throw new AuthError("invalid_credentials", 401);
  }

  let participantId: string | null = null;
  if (account.role === "participant") {
    const [participant] = await db
      .select({ id: participants.id })
      .from(participants)
      .where(
        and(
          eq(participants.accountId, account.id),
          eq(participants.type, "registered"),
        ),
      )
      .limit(1);
    if (!participant) throw new AuthError("invalid_credentials", 401);
    participantId = participant.id;
  }

  await clearRateLimit(bucket, identifier);
  return createAccountSession({
    accountId: account.id,
    participantId,
    previousToken: input.previousToken,
  });
}

export async function createAnonymousSession(input: {
  clientAddress: string;
  previousToken?: string;
}) {
  await consumeRateLimit("anonymous", input.clientAddress);
  const token = createOpaqueToken();
  const lifetime = `${env.ANONYMOUS_SESSION_HOURS} hours`;

  const created = await db.transaction(async (transaction) => {
    if (input.previousToken) {
      await transaction
        .update(sessions)
        .set({ revokedAt: sql`now()` })
        .where(eq(sessions.tokenHash, sessionTokenHash(input.previousToken)));
    }
    const created = await createParticipantRecordInTransaction(transaction, {
      type: "anonymous",
    });
    const [session] = await transaction
      .insert(sessions)
      .values({
        tokenHash: sessionTokenHash(token),
        kind: "anonymous",
        participantId: created.id,
        expiresAt: sql`now() + ${lifetime}::interval`,
      })
      .returning({ expiresAt: sessions.expiresAt });
    if (!session) throw new Error("Session creation returned no record");
    return { participant: created, expiresAt: session.expiresAt };
  });

  return {
    token,
    expiresAt: created.expiresAt,
    persistent: false as const,
    participant: created.participant,
  };
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueViolation(error.cause);
}
