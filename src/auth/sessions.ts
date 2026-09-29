import "server-only";

import { and, eq, isNull, lt, sql } from "drizzle-orm";
import { cookies } from "next/headers";

import { createOpaqueToken, keyedHash } from "@/src/auth/crypto";
import { db } from "@/src/db";
import { accounts, participants, sessions } from "@/src/db/schema";
import { env } from "@/src/lib/env";

export const SESSION_COOKIE = "cag_session";

export type SessionActor =
  | {
      kind: "registered";
      sessionId: string;
      accountId: string;
      participantId: string;
      publicCode: string;
      username: string;
      displayName: string;
      locale: "en" | "ar";
      expiresAt: Date;
    }
  | {
      kind: "anonymous";
      sessionId: string;
      participantId: string;
      publicCode: string;
      anonymousOrdinal: number;
      displayName: string;
      locale: "en" | "ar";
      expiresAt: Date;
    }
  | {
      kind: "admin";
      sessionId: string;
      accountId: string;
      username: string;
      displayName: string;
      locale: "en" | "ar";
      expiresAt: Date;
    };

type AccountSessionInput = {
  accountId: string;
  participantId: string | null;
  previousToken?: string;
};

export async function createAccountSession(input: AccountSessionInput) {
  const token = createOpaqueToken();
  const tokenHash = sessionTokenHash(token);
  const lifetime = `${env.REGISTERED_SESSION_DAYS} days`;

  const expiresAt = await db.transaction(async (transaction) => {
    if (input.previousToken) {
      await transaction
        .update(sessions)
        .set({ revokedAt: sql`now()` })
        .where(
          and(
            eq(sessions.tokenHash, sessionTokenHash(input.previousToken)),
            isNull(sessions.revokedAt),
          ),
        );
    }

    const [created] = await transaction
      .insert(sessions)
      .values({
        tokenHash,
        kind: "account",
        accountId: input.accountId,
        participantId: input.participantId,
        expiresAt: sql`now() + ${lifetime}::interval`,
      })
      .returning({ expiresAt: sessions.expiresAt });
    if (!created) throw new Error("Session creation returned no record");
    return created.expiresAt;
  });

  return { token, expiresAt, persistent: true as const };
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db
    .update(sessions)
    .set({ revokedAt: sql`now()` })
    .where(
      and(
        eq(sessions.tokenHash, sessionTokenHash(token)),
        isNull(sessions.revokedAt),
      ),
    );
}

export async function getCurrentSession(): Promise<SessionActor | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getSessionByToken(token) : null;
}

export async function getSessionByToken(
  token: string,
): Promise<SessionActor | null> {
  const [row] = await db
    .select({
      sessionId: sessions.id,
      kind: sessions.kind,
      createdAt: sessions.createdAt,
      lastSeenAt: sessions.lastSeenAt,
      expiresAt: sessions.expiresAt,
      accountId: accounts.id,
      role: accounts.role,
      username: accounts.username,
      accountDisplayName: accounts.displayName,
      language: accounts.language,
      passwordChangedAt: accounts.passwordChangedAt,
      participantId: participants.id,
      participantAccountId: participants.accountId,
      participantType: participants.type,
      publicCode: participants.publicCode,
      anonymousOrdinal: participants.anonymousOrdinal,
    })
    .from(sessions)
    .leftJoin(accounts, eq(sessions.accountId, accounts.id))
    .leftJoin(participants, eq(sessions.participantId, participants.id))
    .where(
      and(
        eq(sessions.tokenHash, sessionTokenHash(token)),
        isNull(sessions.revokedAt),
        sql`${sessions.expiresAt} > now()`,
      ),
    )
    .limit(1);

  if (!row) return null;

  if (row.kind === "anonymous") {
    if (
      !row.participantId ||
      row.participantType !== "anonymous" ||
      !row.publicCode ||
      row.anonymousOrdinal === null
    ) {
      return null;
    }
    return {
      kind: "anonymous",
      sessionId: row.sessionId,
      participantId: row.participantId,
      publicCode: row.publicCode,
      anonymousOrdinal: row.anonymousOrdinal,
      displayName: `Anonymous ${row.anonymousOrdinal}`,
      locale: "en",
      expiresAt: row.expiresAt,
    };
  }

  if (
    !row.accountId ||
    !row.username ||
    !row.role ||
    !row.passwordChangedAt ||
    row.passwordChangedAt > row.createdAt
  ) {
    return null;
  }

  const locale = row.language === "ar" ? "ar" : "en";
  await touchRegisteredSession(row.sessionId, row.lastSeenAt);

  if (row.role === "admin") {
    return {
      kind: "admin",
      sessionId: row.sessionId,
      accountId: row.accountId,
      username: row.username,
      displayName: row.accountDisplayName || row.username,
      locale,
      expiresAt: row.expiresAt,
    };
  }

  if (
    !row.participantId ||
    row.participantAccountId !== row.accountId ||
    row.participantType !== "registered" ||
    !row.publicCode
  ) {
    return null;
  }

  return {
    kind: "registered",
    sessionId: row.sessionId,
    accountId: row.accountId,
    participantId: row.participantId,
    publicCode: row.publicCode,
    username: row.username,
    displayName: row.accountDisplayName || row.username,
    locale,
    expiresAt: row.expiresAt,
  };
}

export function sessionCookieOptions(session: {
  expiresAt: Date;
  persistent: boolean;
}) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    priority: "high" as const,
    ...(session.persistent ? { expires: session.expiresAt } : {}),
  };
}

export function sessionTokenHash(token: string): string {
  return keyedHash(token, env.SESSION_SECRET);
}

async function touchRegisteredSession(sessionId: string, lastSeenAt: Date) {
  const touchBefore = new Date(Date.now() - 15 * 60 * 1000);
  if (lastSeenAt > touchBefore) return;

  await db
    .update(sessions)
    .set({ lastSeenAt: sql`now()` })
    .where(
      and(
        eq(sessions.id, sessionId),
        isNull(sessions.revokedAt),
        lt(sessions.lastSeenAt, sql`now() - interval '15 minutes'`),
      ),
    );
}
