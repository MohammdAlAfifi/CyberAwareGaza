import Link from "next/link";
import {
  ADMIN_PAGE_SIZE,
  pageCount,
  pageHref,
  type AdminListQuery,
} from "@/src/admin/query";
import { getAdminCopy } from "@/src/admin/copy";
import type { Locale } from "@/src/i18n";

export function RiskBadge({
  locale,
  risk,
}: {
  locale: Locale;
  risk: "low" | "medium" | "high" | null;
}) {
  const t = getAdminCopy(locale);
  return risk ? (
    <span className={`risk-badge risk-badge--${risk}`}>{t[risk]}</span>
  ) : (
    <span className="admin-muted">—</span>
  );
}

export function StatusBadge({
  locale,
  status,
}: {
  locale: Locale;
  status: "in_progress" | "completed" | "abandoned" | "excluded";
}) {
  const t = getAdminCopy(locale);
  const labels = {
    in_progress: t.inProgress,
    completed: t.completed,
    abandoned: t.abandoned,
    excluded: t.excluded,
  };
  return (
    <span className={`admin-status admin-status--${status}`}>
      {labels[status]}
    </span>
  );
}

export function AdminFilters({
  assessment = false,
  locale,
  query,
}: {
  assessment?: boolean;
  locale: Locale;
  query: AdminListQuery;
}) {
  const t = getAdminCopy(locale);
  return (
    <form className="admin-filters" method="get">
      <label className="admin-search">
        <span>{t.search}</span>
        <input
          defaultValue={query.search}
          maxLength={120}
          name="q"
          placeholder={assessment ? t.searchAssessments : t.searchParticipants}
          type="search"
        />
      </label>
      <label>
        <span>{t.accountType}</span>
        <select defaultValue={query.type} name="type">
          <option value="all">{t.allTypes}</option>
          <option value="registered">{t.registered}</option>
          <option value="anonymous">{t.anonymous}</option>
          <option value="imported">{t.imported}</option>
        </select>
      </label>
      {assessment && (
        <label>
          <span>{t.source}</span>
          <select defaultValue={query.source} name="source">
            <option value="all">{t.allSources}</option>
            <option value="web">{t.website}</option>
            <option value="google_form">{t.googleForm}</option>
          </select>
        </label>
      )}
      <label>
        <span>{t.risk}</span>
        <select defaultValue={query.risk} name="risk">
          <option value="all">{t.allRisks}</option>
          <option value="low">{t.low}</option>
          <option value="medium">{t.medium}</option>
          <option value="high">{t.high}</option>
        </select>
      </label>
      <label>
        <span>{t.completion}</span>
        <select defaultValue={query.status} name="status">
          <option value="all">{t.allStatuses}</option>
          <option value="completed">{t.completed}</option>
          <option value="incomplete">{t.incomplete}</option>
        </select>
      </label>
      <label>
        <span>{t.sort}</span>
        <select defaultValue={query.sort} name="sort">
          <option value="newest">{t.newest}</option>
          <option value="oldest">{t.oldest}</option>
          <option value="highest">{t.highestScore}</option>
          <option value="lowest">{t.lowestScore}</option>
        </select>
      </label>
      <div className="admin-filter-actions">
        <button className="button button-primary" type="submit">
          {t.search}
        </button>
        <Link
          className="button button-ghost"
          href={
            assessment
              ? `/${locale}/admin/assessments`
              : `/${locale}/admin/participants`
          }
        >
          {t.clear}
        </Link>
      </div>
    </form>
  );
}

export function AdminPagination({
  locale,
  pathname,
  query,
  total,
}: {
  locale: Locale;
  pathname: string;
  query: AdminListQuery;
  total: number;
}) {
  const t = getAdminCopy(locale);
  const pages = pageCount(total);
  const page = Math.min(query.page, pages);
  const from = total === 0 ? 0 : (page - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(page * ADMIN_PAGE_SIZE, total);
  const label = t.page
    .replace("{page}", String(page))
    .replace("{pages}", String(pages));
  return (
    <nav className="admin-pagination" aria-label={label}>
      <span>
        {t.showing
          .replace("{from}", String(from))
          .replace("{to}", String(to))
          .replace("{total}", String(total))}
      </span>
      <div>
        {page > 1 ? (
          <Link
            className="button button-ghost"
            href={pageHref(pathname, query, page - 1)}
          >
            {t.previous}
          </Link>
        ) : (
          <span className="button button-ghost disabled">{t.previous}</span>
        )}
        <strong>{label}</strong>
        {page < pages ? (
          <Link
            className="button button-ghost"
            href={pageHref(pathname, query, page + 1)}
          >
            {t.next}
          </Link>
        ) : (
          <span className="button button-ghost disabled">{t.next}</span>
        )}
      </div>
    </nav>
  );
}
