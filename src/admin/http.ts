import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AuthError } from "@/src/auth/errors";
import { getSessionByToken, SESSION_COOKIE } from "@/src/auth/sessions";

export async function requireAdminRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const actor = token ? await getSessionByToken(token) : null;
  if (!actor || actor.kind !== "admin" || actor.mustChangePassword) {
    throw new AuthError("session_required", 401);
  }
  return actor;
}

export function adminApiFailure(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { ok: false, error: error.code },
      { status: error.status },
    );
  }
  const message = error instanceof Error ? error.message : "Request failed.";
  return NextResponse.json(
    { ok: false, error: "request_failed", message },
    { status: 400 },
  );
}
