import { createHash } from "node:crypto";

import { parse } from "csv-parse/sync";
import { DateTime } from "luxon";

import {
  assessmentScenarios,
  scenarioKeys,
  type ScenarioKey,
} from "@/src/assessment/content";

export const HISTORICAL_CONSENT_ACCEPTED = "Yes, I agree. / نعم، أوافق.";
export const HISTORICAL_CONSENT_REJECTED =
  "No, I do not agree. / لا، لا أوافق.";
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5_000;

export type ImportRowOutcome =
  "accepted" | "excluded" | "invalid" | "duplicate";

export type ImportProblem = {
  recordNumber: number;
  code: string;
  detail: string;
  field?: string;
};

export type ParsedImportRow = {
  recordNumber: number;
  outcome: ImportRowOutcome;
  sourceRowKey: string | null;
  sourceTimestamp: string | null;
  sourceSubmittedAt: Date | null;
  timestampWarning: string | null;
  answers: Array<{ scenarioKey: ScenarioKey; optionId: string }>;
  problems: ImportProblem[];
};

export type HistoricalCsvPreview = {
  checksum: string;
  columns: {
    timestamp: { index: number; header: string };
    consent: { index: number; header: string };
    scenarios: Record<ScenarioKey, { index: number; header: string }>;
  };
  rows: ParsedImportRow[];
  counts: {
    total: number;
    accepted: number;
    excluded: number;
    invalid: number;
    duplicate: number;
  };
};

export class HistoricalCsvError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

export function parseHistoricalCsv(
  bytes: Uint8Array,
  existingSourceKeys: ReadonlySet<string> = new Set(),
): HistoricalCsvPreview {
  if (bytes.byteLength === 0) {
    throw new HistoricalCsvError("The CSV file is empty.", "empty_file");
  }
  if (bytes.byteLength > MAX_IMPORT_BYTES) {
    throw new HistoricalCsvError(
      `The CSV exceeds the ${MAX_IMPORT_BYTES / 1024 / 1024} MB limit.`,
      "file_too_large",
    );
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new HistoricalCsvError(
      "The file is not valid UTF-8.",
      "invalid_encoding",
    );
  }

  let records: string[][];
  try {
    records = parse(text, {
      bom: true,
      columns: false,
      relax_column_count: false,
      skip_empty_lines: true,
      trim: false,
    }) as string[][];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid CSV.";
    throw new HistoricalCsvError(message, "invalid_csv");
  }

  if (records.length < 1) {
    throw new HistoricalCsvError(
      "The CSV has no header row.",
      "missing_header",
    );
  }
  if (records.length - 1 > MAX_IMPORT_ROWS) {
    throw new HistoricalCsvError(
      `The CSV exceeds the ${MAX_IMPORT_ROWS.toLocaleString("en")} row limit.`,
      "too_many_rows",
    );
  }

  const headers = records[0].map(cleanCell);
  const columns = identifyColumns(headers, records.slice(1));
  const seenSourceKeys = new Set<string>();
  const rows = records.slice(1).map((record, index) => {
    const recordNumber = index + 2;
    const consent = cleanCell(record[columns.consent.index] ?? "");
    if (normalize(consent) === normalize(HISTORICAL_CONSENT_REJECTED)) {
      return {
        recordNumber,
        outcome: "excluded" as const,
        sourceRowKey: null,
        sourceTimestamp: null,
        sourceSubmittedAt: null,
        timestampWarning: null,
        answers: [],
        problems: [
          {
            recordNumber,
            code: "consent_declined",
            field: "consent",
            detail: "The respondent declined research consent.",
          },
        ],
      };
    }
    if (normalize(consent) !== normalize(HISTORICAL_CONSENT_ACCEPTED)) {
      return {
        recordNumber,
        outcome: "invalid" as const,
        sourceRowKey: null,
        sourceTimestamp: null,
        sourceSubmittedAt: null,
        timestampWarning: null,
        answers: [],
        problems: [
          {
            recordNumber,
            code: consent ? "unknown_consent" : "missing_consent",
            field: "consent",
            detail: consent
              ? "Consent does not match either approved bilingual value."
              : "Consent is empty and cannot be treated as agreement.",
          },
        ],
      };
    }

    const problems: ImportProblem[] = [];
    const answers: ParsedImportRow["answers"] = [];
    for (const scenarioKey of scenarioKeys) {
      const cell = cleanCell(
        record[columns.scenarios[scenarioKey].index] ?? "",
      );
      const match = matchHistoricalAnswer(scenarioKey, cell);
      if (!match.ok) {
        problems.push({
          recordNumber,
          code: match.code,
          field: scenarioKey,
          detail: match.detail,
        });
      } else {
        answers.push({ scenarioKey, optionId: match.optionId });
      }
    }
    if (problems.length > 0) {
      return {
        recordNumber,
        outcome: "invalid" as const,
        sourceRowKey: null,
        sourceTimestamp: null,
        sourceSubmittedAt: null,
        timestampWarning: null,
        answers: [],
        problems,
      };
    }

    const rawTimestamp = cleanCell(record[columns.timestamp.index] ?? "");
    const timestamp = parseSourceTimestamp(rawTimestamp);
    const sourceRowKey = rawTimestamp
      ? hashText(
          [
            "google_form",
            normalize(rawTimestamp),
            ...answers.map(
              ({ scenarioKey, optionId }) => `${scenarioKey}:${optionId}`,
            ),
          ].join("|"),
        )
      : null;
    const duplicate =
      sourceRowKey !== null &&
      (existingSourceKeys.has(sourceRowKey) ||
        seenSourceKeys.has(sourceRowKey));
    if (sourceRowKey) seenSourceKeys.add(sourceRowKey);

    return {
      recordNumber,
      outcome: duplicate ? ("duplicate" as const) : ("accepted" as const),
      sourceRowKey,
      sourceTimestamp: rawTimestamp || null,
      sourceSubmittedAt: timestamp.value,
      timestampWarning: timestamp.warning,
      answers,
      problems: duplicate
        ? [
            {
              recordNumber,
              code: "duplicate_source_response",
              detail:
                "The same timestamp and mapped response set already exists in this file or a committed import.",
            },
          ]
        : timestamp.warning
          ? [
              {
                recordNumber,
                code: "timestamp_warning",
                field: "timestamp",
                detail: timestamp.warning,
              },
            ]
          : [],
    };
  });

  return {
    checksum: hashBytes(bytes),
    columns,
    rows,
    counts: {
      total: rows.length,
      accepted: rows.filter(({ outcome }) => outcome === "accepted").length,
      excluded: rows.filter(({ outcome }) => outcome === "excluded").length,
      invalid: rows.filter(({ outcome }) => outcome === "invalid").length,
      duplicate: rows.filter(({ outcome }) => outcome === "duplicate").length,
    },
  };
}

export function matchHistoricalAnswer(
  scenarioKey: ScenarioKey,
  rawValue: string,
):
  { ok: true; optionId: string } | { ok: false; code: string; detail: string } {
  const value = cleanCell(rawValue);
  if (!value) {
    return {
      ok: false,
      code: "missing_answer",
      detail: `${scenarioKey} has no selected answer.`,
    };
  }
  const scenario = assessmentScenarios.find(({ key }) => key === scenarioKey)!;
  const segments = value.split("|").map(cleanCell).filter(Boolean);
  const matches = scenario.options.filter((option) => {
    const accepted = new Set([normalize(option.en), normalize(option.ar)]);
    if (accepted.has(normalize(value))) return true;
    return (
      segments.length > 0 &&
      segments.every((part) => accepted.has(normalize(part)))
    );
  });
  if (matches.length === 1) return { ok: true, optionId: matches[0].id };
  return {
    ok: false,
    code: matches.length > 1 ? "ambiguous_answer" : "unknown_answer",
    detail:
      matches.length > 1
        ? `${scenarioKey} matches more than one approved option.`
        : `${scenarioKey} does not match any approved option text.`,
  };
}

function identifyColumns(
  headers: string[],
  records: string[][],
): HistoricalCsvPreview["columns"] {
  const timestampIndexes = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) =>
      ["طابع زمني", "timestamp"].includes(normalize(header)),
    );
  if (timestampIndexes.length !== 1) {
    throw new HistoricalCsvError(
      "Exactly one timestamp column (طابع زمني / Timestamp) is required.",
      "timestamp_column",
    );
  }

  const approvedConsentValues = new Set(
    [HISTORICAL_CONSENT_ACCEPTED, HISTORICAL_CONSENT_REJECTED].map(normalize),
  );
  const valueCandidates = headers
    .map((header, index) => ({ header, index }))
    .filter(({ index }) => {
      const values = records
        .map((record) => cleanCell(record[index] ?? ""))
        .filter(Boolean);
      return (
        values.length > 0 &&
        values.every((value) => approvedConsentValues.has(normalize(value)))
      );
    });
  const headerCandidates = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => {
      const candidate = normalize(header);
      return (
        candidate.includes("consent") ||
        candidate.includes("agree") ||
        candidate.includes("voluntarily") ||
        candidate.includes("توافق") ||
        candidate.includes("الموافق")
      );
    });
  const consentCandidates =
    valueCandidates.length === 1 ? valueCandidates : headerCandidates;
  if (consentCandidates.length !== 1) {
    throw new HistoricalCsvError(
      "Exactly one research-consent column is required.",
      "consent_column",
    );
  }

  const reserved = new Set([
    timestampIndexes[0].index,
    consentCandidates[0].index,
  ]);
  const scenarios = {} as HistoricalCsvPreview["columns"]["scenarios"];
  for (const scenario of assessmentScenarios) {
    const ranked = headers
      .map((header, index) => ({
        header,
        index,
        score: reserved.has(index)
          ? 0
          : Math.max(
              similarity(header, scenario.question.en),
              similarity(header, scenario.question.ar),
            ),
      }))
      .sort((a, b) => b.score - a.score);
    if (
      !ranked[0] ||
      ranked[0].score < 0.34 ||
      ranked[0].score === ranked[1]?.score
    ) {
      throw new HistoricalCsvError(
        `Could not identify a unique column for ${scenario.key}.`,
        "scenario_column",
      );
    }
    reserved.add(ranked[0].index);
    scenarios[scenario.key] = {
      index: ranked[0].index,
      header: ranked[0].header,
    };
  }

  return {
    timestamp: timestampIndexes[0],
    consent: consentCandidates[0],
    scenarios,
  };
}

function parseSourceTimestamp(raw: string): {
  value: Date | null;
  warning: string | null;
} {
  if (!raw) {
    return {
      value: null,
      warning:
        "The source timestamp is missing; no completion time will be inferred.",
    };
  }
  const iso = DateTime.fromISO(raw, { zone: "Asia/Hebron", setZone: true });
  if (iso.isValid) return { value: iso.toUTC().toJSDate(), warning: null };

  const googleArabic = raw.match(
    /^(\d{4}\/\d{2}\/\d{2})\s+(\d{1,2}:\d{2}:\d{2})\s+([صم])\s+غرينتش\+(\d{1,2})$/u,
  );
  if (googleArabic) {
    const [, date, time, meridiem, sourceOffset] = googleArabic;
    const localized = DateTime.fromFormat(
      `${date} ${time} ${meridiem === "ص" ? "AM" : "PM"}`,
      "yyyy/MM/dd h:mm:ss a",
      { zone: "Asia/Hebron", locale: "en", setZone: true },
    );
    if (localized.isValid && localized.offset === Number(sourceOffset) * 60) {
      return { value: localized.toUTC().toJSDate(), warning: null };
    }
    return {
      value: null,
      warning:
        "The Google Forms timestamp offset does not match Asia/Hebron for that date, so it was not converted.",
    };
  }

  const formats = [
    "yyyy/MM/dd H:mm:ss",
    "yyyy/MM/dd H:mm",
    "M/d/yyyy H:mm:ss",
    "M/d/yyyy H:mm",
    "d/M/yyyy H:mm:ss",
    "d/M/yyyy H:mm",
    "M/d/yyyy h:mm:ss a",
    "d/M/yyyy h:mm:ss a",
  ];
  const valid = formats
    .map((format) =>
      DateTime.fromFormat(raw, format, {
        zone: "Asia/Hebron",
        locale: "en",
        setZone: true,
      }),
    )
    .filter((value) => value.isValid);
  const instants = new Map(
    valid.map((value) => [value.toUTC().toISO(), value]),
  );
  if (instants.size === 1) {
    return {
      value: [...instants.values()][0].toUTC().toJSDate(),
      warning: null,
    };
  }
  return {
    value: null,
    warning:
      instants.size > 1
        ? "The source date is ambiguous between day/month and month/day, so it was not converted."
        : "The source timestamp format is unsupported, so it was not converted.",
  };
}

function similarity(left: string, right: string): number {
  const a = new Set(normalize(left).split(" ").filter(Boolean));
  const b = new Set(normalize(right).split(" ").filter(Boolean));
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / Math.min(a.size, b.size);
}

function cleanCell(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

function normalize(value: string): string {
  return cleanCell(value)
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[\u2018\u2019\u201c\u201d]/g, '"')
    .replace(/^\s*[a-dA-D][.)]\s*/, "")
    .replace(/[^\p{L}\p{N}@!]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashBytes(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function hashText(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
