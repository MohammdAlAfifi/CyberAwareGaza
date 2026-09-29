import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AuthError } from "@/src/auth/errors";
import { authFailureResponse, readJson } from "@/src/auth/http";
import {
  assertTrustedMutationRequest,
  requestClientAddress,
} from "@/src/auth/request-security";
import { SESSION_COOKIE, sessionCookieOptions } from "@/src/auth/sessions";
import { createAnonymousSession } from "@/src/auth/service";
import { anonymousInputSchema } from "@/src/auth/validation";

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const parsed = anonymousInputSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new AuthError("invalid_input", 400);
    const session = await createAnonymousSession({
      clientAddress: requestClientAddress(request),
      previousToken: request.cookies.get(SESSION_COOKIE)?.value,
    });
    const response = NextResponse.json({ ok: true as const });
    response.cookies.set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(session),
    );
    return response;
  } catch (error) {
    return authFailureResponse(error);
  }
}
