import { NextResponse } from "next/server";

import { AuthError } from "@/src/auth/errors";

export type AssessmentErrorCode =
  | "invalid_input"
  | "forbidden"
  | "session_required"
  | "content_unavailable"
  | "consent_required"
  | "attempt_not_found"
  | "attempt_completed"
  | "incomplete_answers"
  | "scoring_unavailable"
  | "server_error";

export class AssessmentError extends Error {
  constructor(
    public readonly code: AssessmentErrorCode,
    public readonly status: number,
  ) {
    super(code);
    this.name = "AssessmentError";
  }
}

export function assessmentFailureResponse(error: unknown) {
  if (error instanceof AssessmentError || error instanceof AuthError) {
    return NextResponse.json(
      { ok: false as const, code: error.code },
      { status: error.status },
    );
  }
  return NextResponse.json(
    { ok: false as const, code: "server_error" as const },
    { status: 500 },
  );
}
