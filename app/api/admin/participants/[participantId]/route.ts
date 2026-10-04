import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminApiFailure, requireAdminRequest } from "@/src/admin/http";
import { deleteParticipant } from "@/src/admin/service";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ participantId: string }> },
) {
  try {
    assertTrustedMutationRequest(request);
    const actor = await requireAdminRequest(request);
    const { participantId } = await context.params;
    if (!uuid.test(participantId)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const deleted = await deleteParticipant(actor, participantId);
    if (!deleted) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true, deleted });
  } catch (error) {
    return adminApiFailure(error);
  }
}
