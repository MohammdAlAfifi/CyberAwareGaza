import "server-only";

import ExcelJS from "exceljs";

import { assessmentScenarios } from "@/src/assessment/content";
import { escapeSpreadsheetFormula } from "@/src/lib/csv";
import type { ResponseReportRow } from "@/src/export/query";
import { describeFilters, type ExportFilters } from "@/src/export/filters";

const NAVY = "FF0B2447";
const TEAL = "FF0F766E";
const PALE = "FFF1F7F6";
const BORDER = "FFD6E2E1";

export async function buildParticipantResponseWorkbook(input: {
  rows: readonly ResponseReportRow[];
  filters: ExportFilters;
  exportedAt: Date;
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CyberAwareGaza";
  workbook.created = input.exportedAt;
  workbook.modified = input.exportedAt;
  const rtl = input.filters.locale === "ar";
  const sheet = workbook.addWorksheet(
    rtl ? "استجابات المشاركين" : "Responses",
    {
      views: [
        {
          state: "frozen",
          xSplit: 4,
          ySplit: 7,
          rightToLeft: rtl,
          showGridLines: false,
        },
      ],
    },
  );
  sheet.properties.defaultRowHeight = 22;
  sheet.mergeCells("A1:P1");
  sheet.getCell("A1").value = rtl
    ? "تقرير استجابات المشاركين - CyberAwareGaza"
    : "CyberAwareGaza Participant Response Report";
  sheet.getCell("A1").font = {
    name: rtl ? "Noto Sans Arabic" : "Arial",
    size: 16,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: NAVY },
  };
  sheet.getCell("A1").alignment = {
    horizontal: rtl ? "right" : "left",
    vertical: "middle",
  };
  sheet.getRow(1).height = 32;

  sheet.getCell("A3").value = rtl ? "تاريخ التصدير" : "Export date";
  sheet.getCell("B3").value = input.exportedAt;
  sheet.getCell("B3").numFmt = "yyyy-mm-dd hh:mm";
  sheet.getCell("D3").value = rtl ? "المشاركون" : "Participants";
  sheet.getCell("E3").value = new Set(
    input.rows.map(({ participantId }) => participantId),
  ).size;
  sheet.getCell("G3").value = rtl ? "التقييمات" : "Assessments";
  sheet.getCell("H3").value = input.rows.length;
  sheet.mergeCells("A4:P4");
  sheet.getCell("A4").value = describeFilters(input.filters).join("   |   ");
  sheet.getCell("A4").font = { italic: true, color: { argb: "FF44546A" } };

  const headers = [
    rtl ? "اسم المشارك" : "Participant name",
    rtl ? "رقم المشارك" : "Participant ID",
    rtl ? "رقم التقييم" : "Assessment ID",
    rtl ? "المصدر" : "Source",
    rtl ? "تاريخ الإرسال" : "Submission date",
    ...assessmentScenarios.map(({ order }) =>
      rtl ? `إجابة السيناريو ${order}` : `Scenario ${order} answer`,
    ),
    rtl ? "الدرجة الخام" : "Raw score",
    rtl ? "مستوى المخاطر" : "Risk level",
    rtl ? "إصدار التقييم" : "Scoring version",
  ];
  sheet.getRow(7).values = headers;
  const body = input.rows.map((row) => [
    safeText(row.participantName),
    safeText(row.participantCode),
    safeText(row.assessmentId),
    row.source === "web"
      ? rtl
        ? "الموقع الإلكتروني"
        : "Website"
      : rtl
        ? "نموذج Google"
        : "Google Form",
    row.sourceSubmittedAt ?? row.completedAt,
    ...assessmentScenarios.map((scenario) => {
      const answer = row.answers.find(
        ({ scenarioKey }) => scenarioKey === scenario.key,
      );
      return safeText(answer ? (rtl ? answer.answerAr : answer.answerEn) : "");
    }),
    row.rawScore,
    localizedRisk(row.risk, rtl),
    safeText(row.scoringVersion),
  ]);
  const lastRow = Math.max(7, 7 + body.length);
  sheet.addTable({
    name: "ParticipantResponseTable",
    ref: "A7",
    headerRow: true,
    totalsRow: false,
    style: { theme: "TableStyleMedium2", showRowStripes: true },
    columns: headers.map((name) => ({ name })),
    rows: body,
  });
  for (let rowIndex = 7; rowIndex <= lastRow; rowIndex += 1) {
    for (let columnIndex = 1; columnIndex <= 16; columnIndex += 1) {
      const cell = sheet.getCell(rowIndex, columnIndex);
      cell.font = {
        name: rtl ? "Noto Sans Arabic" : "Arial",
        size: 10,
        color: { argb: "FF172033" },
      };
      cell.alignment = {
        vertical: "top",
        horizontal: rtl ? "right" : "left",
        wrapText: true,
      };
    }
  }
  const header = sheet.getRow(7);
  header.font = {
    name: rtl ? "Noto Sans Arabic" : "Arial",
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
  header.alignment = {
    vertical: "middle",
    horizontal: "center",
    wrapText: true,
  };
  sheet.getRow(7).height = 34;
  for (let index = 8; index <= lastRow; index += 1) {
    sheet.getRow(index).height = 54;
    if ((index - 8) % 2 === 1) {
      sheet.getRow(index).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: PALE },
      };
    }
  }
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 14;
  sheet.getColumn(3).width = 38;
  sheet.getColumn(4).width = 16;
  sheet.getColumn(5).width = 20;
  for (let index = 6; index <= 13; index += 1)
    sheet.getColumn(index).width = 42;
  sheet.getColumn(14).width = 12;
  sheet.getColumn(15).width = 15;
  sheet.getColumn(16).width = 30;
  sheet.getColumn(5).numFmt = "yyyy-mm-dd hh:mm";
  sheet.getColumn(14).numFmt = "0";
  sheet.autoFilter = { from: "A7", to: `P${lastRow}` };
  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };
  sheet.headerFooter.oddFooter = "&LCyberAwareGaza&RPage &P of &N";

  const reference = workbook.addWorksheet(
    rtl ? "مرجع السيناريوهات" : "Scenario Reference",
    {
      views: [
        { state: "frozen", ySplit: 1, rightToLeft: rtl, showGridLines: false },
      ],
    },
  );
  reference.columns = [
    { header: "Scenario", key: "scenario", width: 11 },
    { header: "Question (English)", key: "questionEn", width: 62 },
    { header: "السؤال (العربية)", key: "questionAr", width: 62 },
    { header: "Option ID", key: "optionId", width: 14 },
    { header: "Option (English)", key: "optionEn", width: 48 },
    { header: "الخيار (العربية)", key: "optionAr", width: 48 },
  ];
  for (const scenario of assessmentScenarios) {
    for (const option of scenario.options) {
      reference.addRow({
        scenario: scenario.key,
        questionEn: safeText(scenario.question.en),
        questionAr: safeText(scenario.question.ar),
        optionId: option.id,
        optionEn: safeText(option.en),
        optionAr: safeText(option.ar),
      });
    }
  }
  reference.getRow(1).font = {
    name: "Arial",
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  reference.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: NAVY },
  };
  reference.getRow(1).alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  reference.getRow(1).height = 30;
  reference.eachRow((row, rowNumber) => {
    row.font = { name: rtl ? "Noto Sans Arabic" : "Arial", size: 10 };
    row.alignment = {
      vertical: "top",
      wrapText: true,
      horizontal: rtl ? "right" : "left",
    };
    if (rowNumber > 1) row.height = 58;
    row.eachCell((cell) => {
      cell.border = { bottom: { style: "thin", color: { argb: BORDER } } };
    });
  });
  reference.autoFilter = "A1:F1";
  reference.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
  };

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function safeText(value: string) {
  return escapeSpreadsheetFormula(value);
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
