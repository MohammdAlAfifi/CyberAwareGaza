import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authFailureResponse, readJson } from "@/src/auth/http";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";
import {
  getSessionByToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/src/auth/sessions";
import { changeAdminPassword } from "@/src/auth/service";
import { adminPasswordChangeSchema } from "@/src/auth/validation";
import { AuthError } from "@/src/auth/errors";

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const actor = token ? await getSessionByToken(token) : null;
    if (!actor || actor.kind !== "admin") {
      throw new AuthError("session_required", 401);
    }
    const parsed = adminPasswordChangeSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new AuthError("invalid_input", 400);
    const session = await changeAdminPassword({
      accountId: actor.accountId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
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
