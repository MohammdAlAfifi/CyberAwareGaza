import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  assessmentFailureResponse,
  AssessmentError,
} from "@/src/assessment/errors";
import { readJson } from "@/src/auth/http";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";
import { getSessionByToken, SESSION_COOKIE } from "@/src/auth/sessions";
import { submitAssessmentFeedback } from "@/src/feedback/service";

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const actor = token ? await getSessionByToken(token) : null;
    if (!actor || actor.kind === "admin")
      throw new AssessmentError("session_required", 401);
    await submitAssessmentFeedback(
      actor.participantId,
      await readJson(request),
    );
    return NextResponse.json({ ok: true as const });
  } catch (error) {
    return assessmentFailureResponse(error);
  }
}
