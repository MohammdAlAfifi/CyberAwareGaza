import type { AnalyticsSource } from "@/src/admin/analytics";
import type { Locale } from "@/src/i18n";
import { DateTime } from "luxon";

export type ExportFilters = {
  source: AnalyticsSource;
  risk: "all" | "low" | "medium" | "high";
  from: Date | null;
  to: Date | null;
  locale: Locale;
};

export function parseExportFilters(
  searchParams: URLSearchParams,
): ExportFilters {
  const source = searchParams.get("source");
  const risk = searchParams.get("risk");
  const locale = searchParams.get("locale");
  return {
    source: source === "web" || source === "google_form" ? source : "all",
    risk: risk === "low" || risk === "medium" || risk === "high" ? risk : "all",
    from: parseDate(searchParams.get("from"), false),
    to: parseDate(searchParams.get("to"), true),
    locale: locale === "ar" ? "ar" : "en",
  };
}

export function describeFilters(filters: ExportFilters): string[] {
  return [
    `Source: ${filters.source === "all" ? "Combined" : filters.source === "web" ? "Website" : "Google Form"}`,
    `Risk: ${filters.risk === "all" ? "All" : filters.risk}`,
    `From: ${filters.from?.toISOString().slice(0, 10) ?? "Any"}`,
    `To: ${filters.to?.toISOString().slice(0, 10) ?? "Any"}`,
  ];
}

function parseDate(value: string | null, endOfDay: boolean) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = DateTime.fromISO(value, { zone: "Asia/Hebron" });
  if (!parsed.isValid) return null;
  return (endOfDay ? parsed.endOf("day") : parsed.startOf("day"))
    .toUTC()
    .toJSDate();
}
