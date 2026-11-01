import { DrizzleQueryError } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/auth/sessions", () => ({
  getSessionByToken: vi.fn(),
  SESSION_COOKIE: "cag_session",
}));

import { adminApiFailure } from "@/src/admin/http";
import { AuthError } from "@/src/auth/errors";
import { HistoricalCsvError } from "@/src/import/historical-csv";

describe("admin database error responses", () => {
  it.each(["ECONNRESET", "23514"])(
    "does not expose SQL or parameters for database failure %s",
    async (code) => {
      const error = new DrizzleQueryError(
        "select * from sessions where token_hash = $1",
        ["private-test-parameter"],
        Object.assign(new Error("Database failure"), { code }),
      );
      const response = adminApiFailure(error);
      expect(response.status).toBe(500);
      const body = await response.text();
      expect(body).not.toContain("select");
      expect(body).not.toContain("sessions");
      expect(body).not.toContain("private-test-parameter");
      expect(JSON.parse(body)).toEqual({
        ok: false,
        error: "request_failed",
        message: "The request could not be completed. Please try again.",
      });
    },
  );

  it("preserves authentication failures", async () => {
    const response = adminApiFailure(new AuthError("forbidden", 403));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "forbidden" });
  });

  it("preserves actionable import validation errors", async () => {
    const response = adminApiFailure(
      new HistoricalCsvError(
        "The selected file no longer matches the validated preview.",
        "preview_mismatch",
      ),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      ok: false,
      message: "The selected file no longer matches the validated preview.",
    });
  });
});
