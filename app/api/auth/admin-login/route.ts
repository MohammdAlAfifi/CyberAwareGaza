import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authFailureResponse, readJson } from "@/src/auth/http";
import {
  assertTrustedMutationRequest,
  requestClientAddress,
} from "@/src/auth/request-security";
import { SESSION_COOKIE, sessionCookieOptions } from "@/src/auth/sessions";
import { loginAccount } from "@/src/auth/service";
import { loginInputSchema, validationFields } from "@/src/auth/validation";

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const parsed = loginInputSchema.safeParse(await readJson(request));
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
    const session = await loginAccount({
      username: parsed.data.username,
      password: parsed.data.password,
      expectedRole: "admin",
      clientAddress: requestClientAddress(request),
      previousToken: request.cookies.get(SESSION_COOKIE)?.value,
    });
    const response = NextResponse.json({
      ok: true as const,
      mustChangePassword: session.mustChangePassword,
    });
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
