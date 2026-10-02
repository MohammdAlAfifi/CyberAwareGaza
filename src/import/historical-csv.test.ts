import { describe, expect, it } from "vitest";

import { assessmentScenarios } from "@/src/assessment/content";
import {
  HISTORICAL_CONSENT_ACCEPTED,
  HISTORICAL_CONSENT_REJECTED,
  matchHistoricalAnswer,
  parseHistoricalCsv,
} from "@/src/import/historical-csv";
import { calculateAssessmentScore } from "@/src/scoring/risk";

const headers = [
  "طابع زمني",
  "Do you voluntarily agree to participate in this research questionnaire?\nهل توافق طوعًا على المشاركة في هذا الاستبيان البحثي؟",
  ...assessmentScenarios.map(
    ({ question }) => `${question.en}\n${question.ar}`,
  ),
];

function row(timestamp: string, consent = HISTORICAL_CONSENT_ACCEPTED) {
  return [
    timestamp,
    consent,
    ...assessmentScenarios.map(({ options }, index) => {
      const option = options[index === 3 ? 0 : 1 % options.length];
      return index === 3 ? option.en : `${option.en} | ${option.ar}`;
    }),
  ];
}

function csv(rows: string[][], bom = false) {
  const encoded = [headers, ...rows]
    .map((record) =>
      record.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
  return new TextEncoder().encode(`${bom ? "\uFEFF" : ""}${encoded}\r\n`);
}

describe("historical Google Form CSV", () => {
  it("parses BOM, Arabic, quoted commas, multiline headers, and CRLF", () => {
    const preview = parseHistoricalCsv(
      csv([row("2026-09-20T10:15:00+03:00")], true),
    );
    expect(preview.counts).toEqual({
      total: 1,
      accepted: 1,
      excluded: 0,
      invalid: 0,
      duplicate: 0,
    });
    expect(preview.rows[0].answers).toHaveLength(8);
    expect(preview.rows[0].sourceSubmittedAt?.toISOString()).toBe(
      "2026-09-20T07:15:00.000Z",
    );
  });

  it("parses the Arabic Google Forms timestamp format in Asia/Hebron", () => {
    const preview = parseHistoricalCsv(
      csv([row("2026/08/30 9:27:14 م غرينتش+3")]),
    );
    expect(preview.rows[0].sourceSubmittedAt?.toISOString()).toBe(
      "2026-08-30T18:27:14.000Z",
    );
    expect(preview.rows[0].timestampWarning).toBeNull();
  });

  it.each([
    [HISTORICAL_CONSENT_ACCEPTED, "accepted"],
    [HISTORICAL_CONSENT_REJECTED, "excluded"],
    ["", "invalid"],
    ["Maybe / ربما", "invalid"],
  ])("classifies consent %j as %s", (consent, outcome) => {
    const preview = parseHistoricalCsv(
      csv([row("2026-09-20T10:15:00+03:00", consent)]),
    );
    expect(preview.rows[0].outcome).toBe(outcome);
  });

  it("does not retain answers for a non-consenting row", () => {
    const rejected = row(
      "2026-09-20T10:15:00+03:00",
      HISTORICAL_CONSENT_REJECTED,
    );
    rejected[2] = "sensitive answer that must not persist";
    const parsed = parseHistoricalCsv(csv([rejected])).rows[0];
    expect(parsed.outcome).toBe("excluded");
    expect(parsed.answers).toEqual([]);
    expect(JSON.stringify(parsed)).not.toContain("sensitive answer");
  });

  it("maps exact English, Arabic, bilingual, and S4 password values to stable IDs", () => {
    for (const scenario of assessmentScenarios) {
      for (const option of scenario.options) {
        expect(matchHistoricalAnswer(scenario.key, option.en)).toEqual({
          ok: true,
          optionId: option.id,
        });
        expect(matchHistoricalAnswer(scenario.key, option.ar)).toEqual({
          ok: true,
          optionId: option.id,
        });
        expect(
          matchHistoricalAnswer(scenario.key, ` ${option.en} | ${option.ar} `),
        ).toEqual({ ok: true, optionId: option.id });
      }
    }
  });

  it("reports missing and unsupported answers with the source record number", () => {
    const missing = row("2026-09-20T10:15:00+03:00");
    missing[3] = "";
    missing[4] = "unsupported choice";
    const parsed = parseHistoricalCsv(csv([missing])).rows[0];
    expect(parsed.outcome).toBe("invalid");
    expect(parsed.problems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordNumber: 2,
          code: "missing_answer",
          field: "S2",
        }),
        expect.objectContaining({
          recordNumber: 2,
          code: "unknown_answer",
          field: "S3",
        }),
      ]),
    );
  });

  it("keeps respondents with identical answers distinct when timestamps differ", () => {
    const preview = parseHistoricalCsv(
      csv([row("2026-09-20T10:15:00+03:00"), row("2026-09-20T10:16:00+03:00")]),
    );
    expect(preview.counts.accepted).toBe(2);
    expect(preview.rows[0].sourceRowKey).not.toBe(preview.rows[1].sourceRowKey);
  });

  it("detects overlapping rows even when a later file is reordered", () => {
    const first = parseHistoricalCsv(
      csv([row("2026-09-20T10:15:00+03:00"), row("2026-09-20T10:16:00+03:00")]),
    );
    const keys = new Set(
      first.rows.flatMap(({ sourceRowKey }) =>
        sourceRowKey ? [sourceRowKey] : [],
      ),
    );
    const reordered = parseHistoricalCsv(
      csv([row("2026-09-20T10:16:00+03:00"), row("2026-09-20T10:15:00+03:00")]),
      keys,
    );
    expect(reordered.counts.duplicate).toBe(2);
    expect(reordered.counts.accepted).toBe(0);
  });

  it("uses the authoritative shared scorer after option mapping", () => {
    const parsed = parseHistoricalCsv(csv([row("2026-09-20T10:15:00+03:00")]))
      .rows[0];
    const score = calculateAssessmentScore(parsed.answers);
    expect(score.contributions.get("S4")).toBe(10);
    expect(score.totalScore).toBe(
      parsed.answers.reduce(
        (sum, answer) => sum + score.contributions.get(answer.scenarioKey)!,
        0,
      ),
    );
  });

  it("flags ambiguous numeric dates without guessing while keeping the row eligible", () => {
    const parsed = parseHistoricalCsv(csv([row("03/04/2026 10:15:00")]))
      .rows[0];
    expect(parsed.outcome).toBe("accepted");
    expect(parsed.sourceSubmittedAt).toBeNull();
    expect(parsed.timestampWarning).toMatch(/ambiguous/i);
  });
});
