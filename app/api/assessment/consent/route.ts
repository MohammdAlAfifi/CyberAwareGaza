import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  assessmentFailureResponse,
  AssessmentError,
} from "@/src/assessment/errors";
import { recordConsent } from "@/src/assessment/service";
import { consentDecisionSchema } from "@/src/assessment/validation";
import { readJson } from "@/src/auth/http";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";
import { getSessionByToken, SESSION_COOKIE } from "@/src/auth/sessions";

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const parsed = consentDecisionSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new AssessmentError("invalid_input", 400);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const actor = token ? await getSessionByToken(token) : null;
    if (!actor || actor.kind === "admin") {
      throw new AssessmentError("session_required", 401);
    }

    const result = await recordConsent({
      participantId: actor.participantId,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true as const, ...result });
  } catch (error) {
    return assessmentFailureResponse(error);
  }
}
