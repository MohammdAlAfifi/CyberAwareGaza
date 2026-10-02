import type { NextRequest } from "next/server";

import { adminApiFailure, requireAdminRequest } from "@/src/admin/http";
import { consumeRateLimit } from "@/src/auth/rate-limit";
import { assessmentScenarios } from "@/src/assessment/content";
import { encodeCsv } from "@/src/export/csv";
import { buildParticipantResponseWorkbook } from "@/src/export/excel";
import { parseExportFilters } from "@/src/export/filters";
import { buildParticipantResponsePdf } from "@/src/export/pdf";
import {
  getActiveAnalyticsExport,
  getParticipantExportRows,
  getResponseReportData,
} from "@/src/export/query";

export const runtime = "nodejs";
export const maxDuration = 60;

const kinds = [
  "participants",
  "assessments",
  "risk-distribution",
  "scenario-analytics",
  "participant-responses",
] as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> },
) {
  try {
    return await handleGet(request, context);
  } catch (error) {
    return adminApiFailure(error);
  }
}

async function handleGet(
  request: NextRequest,
  context: { params: Promise<{ kind: string }> },
) {
  const actor = await requireAdminRequest(request);
  await consumeRateLimit("adminExport", actor.accountId);
  const { kind } = await context.params;
  if (!kinds.includes(kind as (typeof kinds)[number])) {
    return new Response("Not found", { status: 404 });
  }
  const format = request.nextUrl.searchParams.get("format") ?? "csv";
  const filters = parseExportFilters(request.nextUrl.searchParams);
  const exportedAt = new Date();
  const stamp = exportedAt.toISOString().slice(0, 10);

  if (kind === "participant-responses") {
    const rows = await getResponseReportData(actor, filters);
    if (format === "xlsx") {
      const body = await buildParticipantResponseWorkbook({
        rows,
        filters,
        exportedAt,
      });
      return download(
        body,
        `cyberawaregaza-participant-responses-${stamp}.xlsx`,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    }
    if (format === "pdf") {
      const body = await buildParticipantResponsePdf({
        rows,
        filters,
        exportedAt,
      });
      return download(
        body,
        `cyberawaregaza-participant-responses-${stamp}.pdf`,
        "application/pdf",
      );
    }
    return new Response("Unsupported format", { status: 400 });
  }
  if (format !== "csv")
    return new Response("Unsupported format", { status: 400 });

  if (kind === "participants") {
    const rows = await getParticipantExportRows(actor, filters);
    return csvDownload(
      [
        [
          "Participant ID",
          "Display label",
          "Account type",
          "Username",
          "Eligible assessment count",
          "Latest assessment ID",
          "Latest completed score",
          "Latest completed risk",
          "Latest submission date",
        ],
        ...rows.map((row) => [
          row.participantCode,
          row.displayLabel,
          row.accountType,
          row.username,
          row.assessmentCount,
          row.latestAssessmentId,
          row.latestScore,
          row.latestRisk,
          row.latestCompletedAt,
        ]),
      ],
      `cyberawaregaza-participants-${stamp}.csv`,
    );
  }

  if (kind === "assessments") {
    const rows = await getResponseReportData(actor, filters);
    return csvDownload(
      [
        [
          "Assessment ID",
          "Participant ID",
          "Participant label",
          "Source",
          "Status",
          "Scoring version",
          "Raw score",
          "Risk level",
          "Source submission date",
          "Recorded completion date",
          ...assessmentScenarios.flatMap(({ key }) => [
            `${key} option ID`,
            `${key} selected answer (English)`,
            `${key} selected answer (Arabic)`,
            `${key} score delta`,
          ]),
        ],
        ...rows.map((row) => [
          row.assessmentId,
          row.participantCode,
          row.participantName,
          row.source,
          "completed",
          row.scoringVersion,
          row.rawScore,
          row.risk,
          row.sourceSubmittedAt,
          row.completedAt,
          ...assessmentScenarios.flatMap(({ key }) => {
            const answer = row.answers.find(
              ({ scenarioKey }) => scenarioKey === key,
            );
            return answer
              ? [
                  answer.optionId,
                  answer.answerEn,
                  answer.answerAr,
                  answer.contribution,
                ]
              : ["", "", "", ""];
          }),
        ]),
      ],
      `cyberawaregaza-assessments-${stamp}.csv`,
    );
  }

  const analytics = await getActiveAnalyticsExport(actor, filters);
  if (kind === "risk-distribution") {
    return csvDownload(
      [
        [
          "Risk category",
          "Count",
          "Percentage",
          "Eligible assessment total",
          "Source scope",
          "Scoring version",
        ],
        ...["low", "medium", "high"].map((risk) => {
          const count = Number(
            analytics.risks.find((row) => row.risk === risk)?.count ?? 0,
          );
          return [
            risk,
            count,
            analytics.attempts
              ? Math.round((count / analytics.attempts) * 1000) / 10
              : 0,
            analytics.attempts,
            filters.source,
            analytics.active?.rubricVersionId ?? "",
          ];
        }),
      ],
      `cyberawaregaza-risk-distribution-${stamp}.csv`,
    );
  }

  return csvDownload(
    [
      [
        "Scenario ID",
        "Scenario number",
        "Option ID",
        "Option text (English)",
        "Option text (Arabic)",
        "Response count",
        "Percentage",
        "Eligible response total",
        "Source scope",
        "Scoring version",
      ],
      ...analytics.scenarios.map((row) => {
        const denominator = analytics.scenarios
          .filter(({ scenarioKey }) => scenarioKey === row.scenarioKey)
          .reduce((sum, option) => sum + Number(option.count), 0);
        return [
          row.scenarioKey,
          row.scenarioNumber,
          row.optionId,
          row.optionTextEn,
          row.optionTextAr,
          row.count,
          denominator
            ? Math.round((Number(row.count) / denominator) * 1000) / 10
            : 0,
          denominator,
          filters.source,
          analytics.active?.rubricVersionId ?? "",
        ];
      }),
    ],
    `cyberawaregaza-scenario-analytics-${stamp}.csv`,
  );
}

function csvDownload(rows: Parameters<typeof encodeCsv>[0], filename: string) {
  return download(encodeCsv(rows), filename, "text/csv; charset=utf-8");
}

function download(body: string | Buffer, filename: string, type: string) {
  const responseBody =
    typeof body === "string"
      ? body
      : (body.buffer.slice(
          body.byteOffset,
          body.byteOffset + body.byteLength,
        ) as ArrayBuffer);
  return new Response(responseBody, {
    headers: {
      "content-type": type,
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
