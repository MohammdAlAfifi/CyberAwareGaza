import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  assessmentFailureResponse,
  AssessmentError,
} from "@/src/assessment/errors";
import { saveDraftAnswer } from "@/src/assessment/service";
import { progressInputSchema } from "@/src/assessment/validation";
import { readJson } from "@/src/auth/http";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";
import { getSessionByToken, SESSION_COOKIE } from "@/src/auth/sessions";

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const parsed = progressInputSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new AssessmentError("invalid_input", 400);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const actor = token ? await getSessionByToken(token) : null;
    if (!actor || actor.kind === "admin") {
      throw new AssessmentError("session_required", 401);
    }

    await saveDraftAnswer({
      participantId: actor.participantId,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true as const });
  } catch (error) {
    return assessmentFailureResponse(error);
  }
}
