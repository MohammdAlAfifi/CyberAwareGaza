export const analyticsSources = ["all", "web", "google_form"] as const;

export type AnalyticsSource = (typeof analyticsSources)[number];

export type DistributionItem = {
  id: string;
  count: number;
  percentage: number;
};

export function parseAnalyticsSource(
  value: string | string[] | undefined,
): AnalyticsSource {
  const candidate = Array.isArray(value) ? value[0] : value;
  return analyticsSources.includes(candidate as AnalyticsSource)
    ? (candidate as AnalyticsSource)
    : "all";
}

export function percentage(count: number, denominator: number) {
  if (denominator <= 0 || count <= 0) return 0;
  return Math.round((count / denominator) * 1000) / 10;
}

export function distribution<T extends { id: string; count: number }>(
  items: readonly T[],
  denominator: number,
): Array<T & { percentage: number }> {
  return items.map((item) => ({
    ...item,
    percentage: percentage(item.count, denominator),
  }));
}
