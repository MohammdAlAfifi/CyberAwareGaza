import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminApiFailure, requireAdminRequest } from "@/src/admin/http";
import { consumeRateLimit } from "@/src/auth/rate-limit";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";
import { previewHistoricalImport } from "@/src/import/service";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const actor = await requireAdminRequest(request);
    await consumeRateLimit("importPreview", actor.accountId);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
      throw new Error("Select a CSV file.");
    }
    const preview = await previewHistoricalImport({
      actor,
      filename: file.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
    return NextResponse.json({ ok: true as const, preview });
  } catch (error) {
    return adminApiFailure(error);
  }
}
