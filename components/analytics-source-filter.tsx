import Link from "next/link";

import type { AnalyticsSource } from "@/src/admin/analytics";
import { getAdminCopy } from "@/src/admin/copy";
import type { Locale } from "@/src/i18n";

export function AnalyticsSourceFilter({
  locale,
  pathname,
  source,
}: {
  locale: Locale;
  pathname: string;
  source: AnalyticsSource;
}) {
  const t = getAdminCopy(locale);
  return (
    <form className="analytics-filter panel" method="get">
      <label>
        <span>{t.analyticsSource}</span>
        <select defaultValue={source} name="source">
          <option value="all">{t.combinedResults}</option>
          <option value="web">{t.websiteAssessments}</option>
          <option value="google_form">{t.googleFormAssessments}</option>
        </select>
      </label>
      <button className="button button-primary" type="submit">
        {t.applyFilter}
      </button>
      {source !== "all" && (
        <Link className="button button-ghost" href={pathname}>
          {t.clear}
        </Link>
      )}
    </form>
  );
}
