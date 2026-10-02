import { and, asc, eq, ne } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { adminApiFailure, requireAdminRequest } from "@/src/admin/http";
import { db } from "@/src/db";
import { importBatches, importRows } from "@/src/db/schema";
import { encodeCsv } from "@/src/export/csv";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> },
) {
  try {
    return await handleGet(request, context);
  } catch (error) {
    return adminApiFailure(error);
  }
}

async function handleGet(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> },
) {
  const actor = await requireAdminRequest(request);
  const { batchId } = await context.params;
  const [batch] = await db
    .select({ id: importBatches.id, filename: importBatches.originalFilename })
    .from(importBatches)
    .where(
      and(
        eq(importBatches.id, batchId),
        eq(importBatches.createdByAccountId, actor.accountId),
      ),
    )
    .limit(1);
  if (!batch) return new Response("Not found", { status: 404 });
  const rows = await db
    .select({
      recordNumber: importRows.rowNumber,
      outcome: importRows.state,
      code: importRows.rejectionCode,
      detail: importRows.rejectionDetail,
    })
    .from(importRows)
    .where(
      and(eq(importRows.batchId, batchId), ne(importRows.state, "accepted")),
    )
    .orderBy(asc(importRows.rowNumber));
  const body = encodeCsv([
    ["Source record", "Outcome", "Code", "Explanation"],
    ...rows.map((row) => [
      row.recordNumber,
      row.outcome,
      row.code ?? "",
      row.detail ?? "",
    ]),
  ]);
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="import-${batch.id}-diagnostics.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
