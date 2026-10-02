import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { adminApiFailure, requireAdminRequest } from "@/src/admin/http";
import { consumeRateLimit } from "@/src/auth/rate-limit";
import { assertTrustedMutationRequest } from "@/src/auth/request-security";
import { confirmHistoricalImport } from "@/src/import/service";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    assertTrustedMutationRequest(request);
    const actor = await requireAdminRequest(request);
    await consumeRateLimit("importConfirm", actor.accountId);
    const form = await request.formData();
    const file = form.get("file");
    const batchId = form.get("batchId");
    const exclusions = form.get("excludedInvalidRecords");
    if (!(file instanceof File) || typeof batchId !== "string") {
      throw new Error("The validated preview and CSV file are required.");
    }
    let excludedInvalidRecords: number[] = [];
    if (typeof exclusions === "string" && exclusions) {
      const parsed: unknown = JSON.parse(exclusions);
      if (
        !Array.isArray(parsed) ||
        parsed.some((value) => !Number.isInteger(value) || value < 2)
      ) {
        throw new Error("Invalid exclusion selection.");
      }
      excludedInvalidRecords = parsed;
    }
    const report = await confirmHistoricalImport({
      actor,
      batchId,
      bytes: new Uint8Array(await file.arrayBuffer()),
      excludedInvalidRecords,
    });
    revalidatePath("/[locale]/admin", "layout");
    return NextResponse.json({ ok: true as const, report });
  } catch (error) {
    return adminApiFailure(error);
  }
}
