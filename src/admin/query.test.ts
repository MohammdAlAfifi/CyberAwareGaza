import { describe, expect, it } from "vitest";

import { pageCount, pageHref, parseAdminListQuery } from "@/src/admin/query";

describe("admin list query", () => {
  it("bounds and defaults untrusted URL parameters", () => {
    expect(
      parseAdminListQuery({ page: "-5", risk: "critical", q: " x " }),
    ).toMatchObject({ page: 1, risk: "all", search: "x", sort: "newest" });
  });

  it("retains valid filters and builds stable pagination links", () => {
    const query = parseAdminListQuery({
      q: "CAG-0042",
      type: "anonymous",
      risk: "high",
      status: "completed",
      source: "web",
      sort: "highest",
      page: "2",
    });
    expect(query.page).toBe(2);
    expect(pageCount(41)).toBe(3);
    expect(pageHref("/en/admin/assessments", query, 3)).toContain("page=3");
  });
});
