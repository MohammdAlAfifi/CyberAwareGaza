import "server-only";

import { redirect } from "next/navigation";

import { AuthError } from "@/src/auth/errors";
import { isParticipantOwner } from "@/src/auth/policy";
import { getCurrentSession, type SessionActor } from "@/src/auth/sessions";
import type { Locale } from "@/src/i18n";

export function assertParticipantOwnership(
  actor: SessionActor,
  participantId: string,
): asserts actor is Extract<
  SessionActor,
  { kind: "registered" | "anonymous" }
> {
  if (!isParticipantOwner(actor, participantId)) {
    throw new AuthError("forbidden", 403);
  }
}

export async function requireParticipant(locale: Locale) {
  const actor = await getCurrentSession();
  if (!actor || actor.kind === "admin") redirect(`/${locale}/login`);
  return actor;
}

export async function requireAdmin(
  locale: Locale,
  options: { allowPasswordChange?: boolean } = {},
) {
  const actor = await getCurrentSession();
  if (!actor || actor.kind !== "admin") redirect(`/${locale}/admin/login`);
  if (actor.mustChangePassword && !options.allowPasswordChange) {
    redirect(`/${locale}/admin/settings?required=1`);
  }
  return actor;
}
