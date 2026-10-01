export const ADMIN_PAGE_SIZE = 20;

export type AdminListQuery = {
  search: string;
  type: "all" | "registered" | "anonymous" | "imported";
  risk: "all" | "low" | "medium" | "high";
  status: "all" | "completed" | "incomplete";
  source: "all" | "web" | "google_form";
  sort: "newest" | "oldest" | "highest" | "lowest";
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function member<T extends string>(
  value: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function parseAdminListQuery(params: SearchParams): AdminListQuery {
  const rawPage = Number.parseInt(one(params.page) ?? "1", 10);
  return {
    search: (one(params.q) ?? "").trim().slice(0, 120),
    type: member(
      one(params.type),
      ["all", "registered", "anonymous", "imported"] as const,
      "all",
    ),
    risk: member(
      one(params.risk),
      ["all", "low", "medium", "high"] as const,
      "all",
    ),
    status: member(
      one(params.status),
      ["all", "completed", "incomplete"] as const,
      "all",
    ),
    source: member(
      one(params.source),
      ["all", "web", "google_form"] as const,
      "all",
    ),
    sort: member(
      one(params.sort),
      ["newest", "oldest", "highest", "lowest"] as const,
      "newest",
    ),
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
}

export function pageHref(
  pathname: string,
  query: AdminListQuery,
  page: number,
) {
  const params = new URLSearchParams();
  if (query.search) params.set("q", query.search);
  if (query.type !== "all") params.set("type", query.type);
  if (query.risk !== "all") params.set("risk", query.risk);
  if (query.status !== "all") params.set("status", query.status);
  if (query.source !== "all") params.set("source", query.source);
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}
