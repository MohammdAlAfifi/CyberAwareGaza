import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { ASSESSMENT_CONTENT_VERSION, assessmentScenarios } from "./content";

describe("authoritative assessment content", () => {
  it("keeps the eight PDF scenarios in exact S1-S8 order", () => {
    expect(ASSESSMENT_CONTENT_VERSION).toBe("pdf-section-7-v1");
    expect(assessmentScenarios.map(({ key }) => key)).toEqual([
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
      "S7",
      "S8",
    ]);
    expect(assessmentScenarios.map(({ order }) => order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
  });

  it("preserves option order and stable language-independent IDs", () => {
    expect(assessmentScenarios.map(({ options }) => options.length)).toEqual([
      3, 3, 3, 4, 3, 3, 3, 3,
    ]);
    for (const scenario of assessmentScenarios) {
      expect(scenario.options.map(({ id }) => id)).toEqual(
        scenario.options.map((_, index) => `${scenario.key}O${index + 1}`),
      );
    }
  });

  it("locks representative punctuation and Arabic text from the rendered PDF", () => {
    expect(assessmentScenarios[0].question.en).toContain(
      "“Your account will be suspended within 2 hours unless you verify your login now.”",
    );
    expect(assessmentScenarios[0].question.ar).toContain(
      "«سيتم إيقاف حسابك خلال ساعتين ما لم تقم بتأكيد تسجيل الدخول الآن.»",
    );
    expect(assessmentScenarios[4].question.en).toContain(
      "Click here to view your grades .",
    );
    expect(assessmentScenarios[5].question.en).toContain("Invoice.pdf.exe");
    expect(assessmentScenarios[5].question.ar).toContain("Invoice.pdf.exe");
    expect(assessmentScenarios[7].options[1].ar).toBe(
      "عدم مشاركة الرمز، والدخول يدويًا إلى الموقع الرسمي ومراجعة إعدادات الأمان.",
    );
  });

  it("seeds the same exact bilingual content in the Phase 4 migration", () => {
    const migration = readFileSync(
      fileURLToPath(
        new URL("../../drizzle/0004_bored_callisto.sql", import.meta.url),
      ),
      "utf8",
    );
    for (const scenario of assessmentScenarios) {
      expect(migration).toContain(scenario.question.en);
      expect(migration).toContain(scenario.question.ar);
      for (const option of scenario.options) {
        expect(migration).toContain(option.en);
        expect(migration).toContain(option.ar);
      }
    }
  });
});
