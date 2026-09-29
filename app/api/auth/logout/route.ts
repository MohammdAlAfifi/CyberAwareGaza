import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authFailureResponse } from "@/src/auth/http";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";
import { revokeSession, SESSION_COOKIE } from "@/src/auth/sessions";

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    await revokeSession(request.cookies.get(SESSION_COOKIE)?.value);
    const response = NextResponse.json({ ok: true as const });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return authFailureResponse(error);
  }
}
