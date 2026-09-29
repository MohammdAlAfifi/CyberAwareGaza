import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authFailureResponse, readJson } from "@/src/auth/http";
import {
  assertTrustedMutationRequest,
  requestClientAddress,
} from "@/src/auth/request-security";
import { SESSION_COOKIE, sessionCookieOptions } from "@/src/auth/sessions";
import { signupParticipant } from "@/src/auth/service";
import { signupInputSchema, validationFields } from "@/src/auth/validation";

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const parsed = signupInputSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false as const,
          code: "invalid_input" as const,
          fields: validationFields(parsed.error),
        },
        { status: 400 },
      );
    }

    const session = await signupParticipant({
      ...parsed.data,
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
