import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import PDFDocument from "pdfkit";

import { describeFilters, type ExportFilters } from "@/src/export/filters";
import type { ResponseReportRow } from "@/src/export/query";

const NAVY = "#0B2447";
const TEAL = "#0F766E";
const TEXT = "#172033";
const MUTED = "#5D6B78";
const RULE = "#D6E2E1";
const PAGE = { size: "A4" as const, margin: 48 };

export async function buildParticipantResponsePdf(input: {
  rows: readonly ResponseReportRow[];
  filters: ExportFilters;
  exportedAt: Date;
}) {
  const rtl = input.filters.locale === "ar";
  const doc = new PDFDocument({
    autoFirstPage: false,
    bufferPages: true,
    compress: true,
    info: {
      Title: rtl
        ? "تقرير استجابات المشاركين - CyberAwareGaza"
        : "CyberAwareGaza Participant Response Report",
      Author: "CyberAwareGaza",
    },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const arabicFont = path.join(
    process.cwd(),
    "node_modules",
    "@ibm",
    "plex-sans-arabic",
    "fonts",
    "complete",
    "woff",
    "IBMPlexSansArabic-Regular.woff",
  );
  const arabicBoldFont = path.join(
    process.cwd(),
    "node_modules",
    "@ibm",
    "plex-sans-arabic",
    "fonts",
    "complete",
    "woff",
    "IBMPlexSansArabic-Bold.woff",
  );
  doc.registerFont("CAG-Regular", await readFile(arabicFont));
  doc.registerFont("CAG-Bold", await readFile(arabicBoldFont));
  const logo = await readFile(
    path.join(process.cwd(), "public", "CyberAwareGaza_Logo.jpg"),
  );

  const addPage = () => {
    doc.addPage(PAGE);
    doc.image(logo, PAGE.margin, 24, { fit: [92, 36] });
    doc
      .moveTo(PAGE.margin, 68)
      .lineTo(doc.page.width - PAGE.margin, 68)
      .lineWidth(1)
      .strokeColor(TEAL)
      .stroke();
    doc.y = 82;
  };
  addPage();
  setFont(doc, rtl, true);
  doc
    .fontSize(18)
    .fillColor(NAVY)
    .text(
      prepareText(
        doc,
        rtl ? "تقرير استجابات المشاركين" : "Participant Response Report",
        rtl,
        doc.page.width - PAGE.margin * 2,
      ),
      PAGE.margin,
      doc.y,
      textOptions(doc, rtl, 18),
    );
  doc.moveDown(0.45);
  setFont(doc, rtl, false);
  doc.fontSize(9.5).fillColor(MUTED);
  writeLine(
    doc,
    rtl
      ? `تاريخ التصدير: ${formatDate(input.exportedAt, "ar")}`
      : `Export date: ${formatDate(input.exportedAt, "en")}`,
    rtl,
  );
  writeLine(
    doc,
    rtl
      ? `المشاركون: ${new Set(input.rows.map(({ participantId }) => participantId)).size}    التقييمات: ${input.rows.length}`
      : `Participants: ${new Set(input.rows.map(({ participantId }) => participantId)).size}    Assessments: ${input.rows.length}`,
    rtl,
  );
  for (const filter of localizedFilters(input.filters))
    writeLine(doc, filter, rtl);
  doc.moveDown(0.7);

  input.rows.forEach((row, index) => {
    if (index > 0) addPage();
    drawAssessment(doc, row, rtl, addPage);
  });
  if (input.rows.length === 0) {
    setFont(doc, rtl, false);
    doc.fontSize(11).fillColor(TEXT);
    writeLine(
      doc,
      rtl
        ? "لا توجد تقييمات مكتملة تطابق المرشحات."
        : "No completed assessments match the filters.",
      rtl,
    );
  }

  const pages = doc.bufferedPageRange();
  for (let index = pages.start; index < pages.start + pages.count; index += 1) {
    doc.switchToPage(index);
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc
      .moveTo(PAGE.margin, doc.page.height - 36)
      .lineTo(doc.page.width - PAGE.margin, doc.page.height - 36)
      .lineWidth(0.5)
      .strokeColor(RULE)
      .stroke();
    doc
      .font("CAG-Regular")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        `CyberAwareGaza  |  ${index + 1} / ${pages.count}`,
        PAGE.margin,
        doc.page.height - 28,
        {
          width: doc.page.width - PAGE.margin * 2,
          align: "center",
          lineBreak: false,
        },
      );
    doc.page.margins.bottom = bottomMargin;
  }
  doc.end();
  return completed;
}

function drawAssessment(
  doc: PDFKit.PDFDocument,
  row: ResponseReportRow,
  rtl: boolean,
  addPage: () => void,
) {
  setFont(doc, rtl, true);
  doc.fontSize(13).fillColor(NAVY);
  writeLine(
    doc,
    rtl
      ? `${row.participantName} - ${row.participantCode}`
      : `${row.participantName} - ${row.participantCode}`,
    rtl,
  );
  doc.moveDown(0.25);
  setFont(doc, rtl, false);
  doc.fontSize(9.5).fillColor(TEXT);
  const source =
    row.source === "web"
      ? rtl
        ? "الموقع الإلكتروني"
        : "Website"
      : rtl
        ? "نموذج جوجل"
        : "Google Form";
  const submitted = row.sourceSubmittedAt ?? row.completedAt;
  const facts = rtl
    ? [
        `رقم التقييم: ${row.assessmentId}`,
        `المصدر: ${source}`,
        `تاريخ الإرسال: ${submitted ? formatDate(submitted, "ar") : "غير متاح"}`,
        `الدرجة الخام: ${row.rawScore}    مستوى المخاطر: ${localizedRisk(row.risk, true)}`,
      ]
    : [
        `Assessment ID: ${row.assessmentId}`,
        `Source: ${source}`,
        `Submission date: ${submitted ? formatDate(submitted, "en") : "Not available"}`,
        `Raw score: ${row.rawScore}    Risk level: ${localizedRisk(row.risk, false)}`,
      ];
  for (const fact of facts) writeMixedLine(doc, fact, rtl);
  doc.moveDown(0.45);
  doc
    .moveTo(PAGE.margin, doc.y)
    .lineTo(doc.page.width - PAGE.margin, doc.y)
    .strokeColor(TEAL)
    .lineWidth(1.2)
    .stroke();
  doc.moveDown(0.6);

  for (const answer of row.answers) {
    const question = rtl ? answer.questionAr : answer.questionEn;
    const selected = rtl ? answer.answerAr : answer.answerEn;
    const width = doc.page.width - PAGE.margin * 2;
    setFont(doc, rtl && hasArabic(question), true);
    doc.fontSize(10.5);
    const preparedQuestion = prepareText(doc, question, rtl, width);
    const questionHeight = doc.heightOfString(
      preparedQuestion,
      textOptions(doc, rtl, 10.5),
    );
    setFont(doc, rtl && hasArabic(selected), false);
    doc.fontSize(10);
    const preparedAnswer = prepareText(doc, selected, rtl, width - 24);
    const answerHeight = doc.heightOfString(
      preparedAnswer,
      textOptions(doc, rtl, 10),
    );
    if (doc.y + questionHeight + answerHeight + 34 > doc.page.height - 48) {
      addPage();
      setFont(doc, rtl, true);
      doc.fontSize(9.5).fillColor(NAVY);
      writeMixedLine(
        doc,
        `${row.participantName} - ${row.participantCode} (continued)`,
        rtl,
      );
      doc.moveDown(0.4);
    }
    setFont(doc, rtl && hasArabic(question), true);
    doc
      .fontSize(10.5)
      .fillColor(NAVY)
      .text(preparedQuestion, PAGE.margin, doc.y, {
        ...textOptions(doc, rtl, 10.5),
        width,
      });
    doc.moveDown(0.2);
    setFont(doc, rtl && hasArabic(selected), false);
    doc
      .fontSize(10)
      .fillColor(TEXT)
      .text(preparedAnswer, PAGE.margin + 12, doc.y, {
        ...textOptions(doc, rtl, 10),
        width: width - 24,
      });
    doc.moveDown(0.35);
    doc
      .moveTo(PAGE.margin, doc.y)
      .lineTo(doc.page.width - PAGE.margin, doc.y)
      .strokeColor(RULE)
      .lineWidth(0.5)
      .stroke();
    doc.moveDown(0.45);
  }
}

function setFont(doc: PDFKit.PDFDocument, arabic: boolean, bold: boolean) {
  void arabic;
  doc.font(bold ? "CAG-Bold" : "CAG-Regular");
}

function writeLine(doc: PDFKit.PDFDocument, value: string, rtl: boolean) {
  const width = doc.page.width - PAGE.margin * 2;
  doc.text(
    prepareText(doc, value, rtl, width),
    PAGE.margin,
    doc.y,
    textOptions(doc, rtl, 10),
  );
}

function writeMixedLine(doc: PDFKit.PDFDocument, value: string, rtl: boolean) {
  setFont(doc, rtl && hasArabic(value), false);
  writeLine(doc, value, rtl);
}

function textOptions(doc: PDFKit.PDFDocument, rtl: boolean, fontSize: number) {
  return {
    width: doc.page.width - PAGE.margin * 2,
    align: rtl ? ("right" as const) : ("left" as const),
    lineGap: Math.max(2, fontSize * 0.28),
  };
}

function hasArabic(value: string) {
  return /[\u0600-\u06ff]/.test(value);
}

function prepareText(
  doc: PDFKit.PDFDocument,
  value: string,
  rtl: boolean,
  width: number,
) {
  if (!rtl || !hasArabic(value)) return value;
  return value
    .split("\n")
    .flatMap((paragraph) => wrapLogicalLine(doc, paragraph, width))
    .map(toVisualRtl)
    .join("\n");
}

function wrapLogicalLine(
  doc: PDFKit.PDFDocument,
  value: string,
  width: number,
) {
  const words = value.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let line = words[0];
  for (const word of words.slice(1)) {
    const candidate = `${line} ${word}`;
    if (doc.widthOfString(candidate) <= width) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

function toVisualRtl(value: string) {
  return value.split(/\s+/).filter(Boolean).reverse().join("  ");
}

function formatDate(value: Date, locale: "en" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-PS" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Hebron",
  }).format(value);
}

function localizedRisk(risk: ResponseReportRow["risk"], rtl: boolean) {
  if (!rtl)
    return risk === "low"
      ? "Low risk"
      : risk === "medium"
        ? "Medium risk"
        : "High risk";
  return risk === "low"
    ? "مخاطر منخفضة"
    : risk === "medium"
      ? "مخاطر متوسطة"
      : "مخاطر مرتفعة";
}

function localizedFilters(filters: ExportFilters) {
  if (filters.locale !== "ar") return describeFilters(filters);
  const source =
    filters.source === "all"
      ? "النتائج المجمعة"
      : filters.source === "web"
        ? "الموقع الإلكتروني"
        : "نموذج جوجل";
  const risk =
    filters.risk === "all" ? "كل المستويات" : localizedRisk(filters.risk, true);
  return [
    `المصدر ${source}`,
    `مستوى المخاطر ${risk}`,
    `من تاريخ ${filters.from ? formatDate(filters.from, "ar") : "أي تاريخ"}`,
    `إلى تاريخ ${filters.to ? formatDate(filters.to, "ar") : "أي تاريخ"}`,
  ];
}
