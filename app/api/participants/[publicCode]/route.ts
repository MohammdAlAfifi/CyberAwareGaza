import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { assertParticipantOwnership } from "@/src/auth/authorization";
import { AuthError } from "@/src/auth/errors";
import { authFailureResponse } from "@/src/auth/http";
import { getSessionByToken, SESSION_COOKIE } from "@/src/auth/sessions";
import { db } from "@/src/db";
import { participants } from "@/src/db/schema";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ publicCode: string }> },
) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const actor = token ? await getSessionByToken(token) : null;
    if (!actor) throw new AuthError("session_required", 401);

    const { publicCode } = await context.params;
    const [participant] = await db
      .select({ id: participants.id, publicCode: participants.publicCode })
      .from(participants)
      .where(eq(participants.publicCode, publicCode))
      .limit(1);
    if (!participant) throw new AuthError("forbidden", 403);
    assertParticipantOwnership(actor, participant.id);

    return NextResponse.json({
      publicCode: participant.publicCode,
      displayName: actor.displayName,
      kind: actor.kind,
    });
  } catch (error) {
    return authFailureResponse(error);
  }
}
