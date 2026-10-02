"use client";

import { useMemo, useRef, useState } from "react";

import type { Locale } from "@/src/i18n";

type Preview = {
  batchId: string;
  filename: string;
  canConfirm: boolean;
  counts: {
    total: number;
    accepted: number;
    excluded: number;
    invalid: number;
    duplicate: number;
  };
  columns: {
    timestamp: { index: number; header: string };
    consent: { index: number; header: string };
    scenarios: Record<string, { index: number; header: string }>;
  };
  rows: Array<{
    recordNumber: number;
    outcome: "accepted" | "excluded" | "invalid" | "duplicate";
    timestampWarning: string | null;
    problems: Array<{ code: string; detail: string; field?: string }>;
  }>;
};

type ImportReport = {
  state: "committed" | "duplicate";
  totalRows: number;
  acceptedRows: number;
  excludedRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedAssessments: number;
  participantsCreated: number;
  responsesCreated: number;
};

const words = {
  en: {
    upload: "Historical Google Form CSV",
    uploadHelp:
      "Drop the UTF-8 CSV here or choose a file. Previewing never creates participants or assessments.",
    choose: "Choose CSV",
    preview: "Validate and preview",
    validating: "Validating…",
    mapping: "Detected column mapping",
    timestamp: "Timestamp",
    consent: "Research consent",
    problems: "Validation report",
    confirm: "Confirm import",
    confirming: "Importing…",
    exclude: "Explicitly exclude this invalid row",
    correction:
      "Correct the CSV or explicitly exclude every invalid consenting row before confirmation.",
    diagnostic: "Download diagnostic report",
    complete: "Import completed",
    exports: "Research exports",
    exportsHelp:
      "Exports include the entire consent-eligible matching dataset, not only the visible admin table page.",
    source: "Source",
    all: "Combined",
    web: "Website",
    form: "Google Form",
    risk: "Risk",
    anyRisk: "All risk levels",
    from: "From date",
    to: "To date",
    participants: "Participants CSV",
    assessments: "Assessments CSV",
    risks: "Risk distribution CSV",
    scenarios: "Scenario analytics CSV",
    excel: "Participant responses Excel",
    pdf: "Participant responses PDF",
    accepted: "Accepted rows",
    excluded: "Excluded rows",
    invalid: "Invalid rows",
    duplicate: "Duplicate rows",
    total: "Total rows",
    imported: "Imported assessments",
  },
  ar: {
    upload: "ملف CSV التاريخي لنموذج Google",
    uploadHelp:
      "أفلت ملف CSV بترميز UTF-8 هنا أو اختر ملفًا. لا تنشئ المعاينة مشاركين أو تقييمات.",
    choose: "اختيار ملف CSV",
    preview: "التحقق والمعاينة",
    validating: "جارٍ التحقق…",
    mapping: "تعيين الأعمدة المكتشف",
    timestamp: "الطابع الزمني",
    consent: "الموافقة البحثية",
    problems: "تقرير التحقق",
    confirm: "تأكيد الاستيراد",
    confirming: "جارٍ الاستيراد…",
    exclude: "استبعاد هذا الصف غير الصالح صراحةً",
    correction:
      "صحح ملف CSV أو استبعد صراحةً كل صف موافق غير صالح قبل التأكيد.",
    diagnostic: "تنزيل تقرير التشخيص",
    complete: "اكتمل الاستيراد",
    exports: "تصدير بيانات البحث",
    exportsHelp:
      "تشمل التصديرات كامل مجموعة البيانات المطابقة والمؤهلة بالموافقة، وليس صفحة الجدول الظاهرة فقط.",
    source: "المصدر",
    all: "النتائج المجمعة",
    web: "الموقع الإلكتروني",
    form: "نموذج Google",
    risk: "مستوى المخاطر",
    anyRisk: "كل المستويات",
    from: "من تاريخ",
    to: "إلى تاريخ",
    participants: "CSV للمشاركين",
    assessments: "CSV للتقييمات",
    risks: "CSV لتوزيع المخاطر",
    scenarios: "CSV لتحليلات السيناريوهات",
    excel: "Excel لاستجابات المشاركين",
    pdf: "PDF لاستجابات المشاركين",
    accepted: "الصفوف المقبولة",
    excluded: "الصفوف المستبعدة",
    invalid: "الصفوف غير الصالحة",
    duplicate: "الصفوف المكررة",
    total: "إجمالي الصفوف",
    imported: "التقييمات المستوردة",
  },
} as const;

export function ImportExportWorkspace({ locale }: { locale: Locale }) {
  const t = words[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState<"preview" | "confirm" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState("all");
  const [risk, setRisk] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const invalidRecords = useMemo(
    () =>
      preview?.rows
        .filter(({ outcome }) => outcome === "invalid")
        .map(({ recordNumber }) => recordNumber) ?? [],
    [preview],
  );
  const ready =
    Boolean(preview?.counts.accepted) &&
    invalidRecords.every((record) => excluded.has(record));

  async function validate() {
    if (!file) return;
    setBusy("preview");
    setError(null);
    setReport(null);
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/admin/imports/preview", {
        method: "POST",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.message || payload.error || "Validation failed.",
        );
      setPreview(payload.preview);
      setExcluded(new Set());
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "Validation failed.");
    } finally {
      setBusy(null);
    }
  }

  async function confirm() {
    if (!file || !preview || !ready) return;
    setBusy("confirm");
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("batchId", preview.batchId);
    form.set("excludedInvalidRecords", JSON.stringify([...excluded]));
    try {
      const response = await fetch("/api/admin/imports/confirm", {
        method: "POST",
        body: form,
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.message || payload.error || "Import failed.");
      setReport(payload.report);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Import failed.");
    } finally {
      setBusy(null);
    }
  }

  const exportHref = (kind: string, format = "csv") => {
    const query = new URLSearchParams({ format, locale, source, risk });
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    return `/api/admin/exports/${kind}?${query}`;
  };

  return (
    <>
      <section className="panel transfer-card">
        <div>
          <p className="eyebrow">CSV</p>
          <h2>{t.upload}</h2>
          <p>{t.uploadHelp}</p>
        </div>
        <div
          className="csv-dropzone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const next = event.dataTransfer.files[0];
            if (next) {
              setFile(next);
              setPreview(null);
              setReport(null);
            }
          }}
        >
          <input
            accept=".csv,text/csv"
            aria-label={t.choose}
            hidden
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
              setReport(null);
            }}
            ref={inputRef}
            type="file"
          />
          <button
            className="button button-secondary"
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            {t.choose}
          </button>
          <bdi className="selected-file" dir="ltr">
            {file?.name ?? "—"}
          </bdi>
          <button
            className="button button-primary"
            disabled={!file || busy !== null}
            onClick={validate}
            type="button"
          >
            {busy === "preview" ? t.validating : t.preview}
          </button>
        </div>
        {error ? (
          <p className="admin-required" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {preview ? (
        <section className="panel transfer-card">
          <div className="transfer-heading">
            <div>
              <p className="eyebrow">{preview.filename}</p>
              <h2>{t.mapping}</h2>
            </div>
            <a
              className="button button-secondary"
              href={`/api/admin/imports/${preview.batchId}/diagnostics`}
            >
              {t.diagnostic}
            </a>
          </div>
          <div className="import-counters">
            {[
              [t.total, preview.counts.total],
              [t.accepted, preview.counts.accepted],
              [t.excluded, preview.counts.excluded],
              [t.invalid, preview.counts.invalid],
              [t.duplicate, preview.counts.duplicate],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <dl className="column-mapping">
            <div>
              <dt>{t.timestamp}</dt>
              <dd>
                {preview.columns.timestamp.index + 1}:{" "}
                {preview.columns.timestamp.header}
              </dd>
            </div>
            <div>
              <dt>{t.consent}</dt>
              <dd>
                {preview.columns.consent.index + 1}:{" "}
                {preview.columns.consent.header}
              </dd>
            </div>
            {Object.entries(preview.columns.scenarios).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>
                  {value.index + 1}: {value.header}
                </dd>
              </div>
            ))}
          </dl>
          <h3>{t.problems}</h3>
          <div className="validation-list">
            {preview.rows
              .filter(
                ({ problems, timestampWarning }) =>
                  problems.length || timestampWarning,
              )
              .map((row) => (
                <article
                  className={`validation-row validation-row--${row.outcome}`}
                  key={row.recordNumber}
                >
                  <div>
                    <strong>#{row.recordNumber}</strong>
                    <span>{row.outcome}</span>
                  </div>
                  {row.problems.map((problem, index) => (
                    <p key={`${problem.code}-${index}`}>
                      {problem.field ? `${problem.field}: ` : ""}
                      {problem.detail}
                    </p>
                  ))}
                  {row.outcome === "invalid" ? (
                    <label>
                      <input
                        checked={excluded.has(row.recordNumber)}
                        onChange={(event) =>
                          setExcluded((current) => {
                            const next = new Set(current);
                            if (event.target.checked)
                              next.add(row.recordNumber);
                            else next.delete(row.recordNumber);
                            return next;
                          })
                        }
                        type="checkbox"
                      />
                      {t.exclude}
                    </label>
                  ) : null}
                </article>
              ))}
          </div>
          {invalidRecords.length && !ready ? (
            <p className="admin-required">{t.correction}</p>
          ) : null}
          <button
            className="button button-primary confirm-import"
            disabled={!ready || busy !== null || Boolean(report)}
            onClick={confirm}
            type="button"
          >
            {busy === "confirm" ? t.confirming : t.confirm}
          </button>
        </section>
      ) : null}

      {report ? (
        <section
          className="panel transfer-card import-complete"
          aria-live="polite"
        >
          <h2>{t.complete}</h2>
          <div className="import-counters">
            {[
              [t.total, report.totalRows],
              [t.accepted, report.acceptedRows],
              [t.excluded, report.excludedRows],
              [t.invalid, report.invalidRows],
              [t.duplicate, report.duplicateRows],
              [t.imported, report.importedAssessments],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel transfer-card">
        <div>
          <p className="eyebrow">CSV · XLSX · PDF</p>
          <h2>{t.exports}</h2>
          <p>{t.exportsHelp}</p>
        </div>
        <div className="export-filters">
          <label>
            {t.source}
            <select
              onChange={(event) => setSource(event.target.value)}
              value={source}
            >
              <option value="all">{t.all}</option>
              <option value="web">{t.web}</option>
              <option value="google_form">{t.form}</option>
            </select>
          </label>
          <label>
            {t.risk}
            <select
              onChange={(event) => setRisk(event.target.value)}
              value={risk}
            >
              <option value="all">{t.anyRisk}</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            {t.from}
            <input
              onChange={(event) => setFrom(event.target.value)}
              type="date"
              value={from}
            />
          </label>
          <label>
            {t.to}
            <input
              onChange={(event) => setTo(event.target.value)}
              type="date"
              value={to}
            />
          </label>
        </div>
        <div className="export-grid">
          <a
            className="button button-secondary"
            href={exportHref("participants")}
          >
            {t.participants}
          </a>
          <a
            className="button button-secondary"
            href={exportHref("assessments")}
          >
            {t.assessments}
          </a>
          <a
            className="button button-secondary"
            href={exportHref("risk-distribution")}
          >
            {t.risks}
          </a>
          <a
            className="button button-secondary"
            href={exportHref("scenario-analytics")}
          >
            {t.scenarios}
          </a>
          <a
            className="button button-primary"
            href={exportHref("participant-responses", "xlsx")}
          >
            {t.excel}
          </a>
          <a
            className="button button-primary"
            href={exportHref("participant-responses", "pdf")}
          >
            {t.pdf}
          </a>
        </div>
      </section>
    </>
  );
}
