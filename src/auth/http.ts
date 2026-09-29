import { NextResponse } from "next/server";

import { AuthError } from "@/src/auth/errors";

export function authFailureResponse(error: unknown) {
  if (error instanceof AuthError) {
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

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AuthError("invalid_input", 400);
  }
}
