import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionActor } from "@/src/auth/sessions";

vi.mock("server-only", () => ({}));
vi.mock("@/src/db", () => ({ db: { execute: vi.fn(), transaction: vi.fn() } }));
vi.mock("@/src/auth/sessions", () => ({ getCurrentSession: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("not-found");
  }),
}));

import AdminFeedbackPage from "@/app/[locale]/admin/feedbacks/page";
import { getCurrentSession } from "@/src/auth/sessions";
import { db } from "@/src/db";
import { getFeedbackAnalytics, getFeedbackCount } from "./feedback-analytics";

beforeEach(() => vi.resetAllMocks());

describe("feedback administrator access", () => {
  it.each([
    null,
    { kind: "registered" },
    { kind: "anonymous" },
    { kind: "admin", mustChangePassword: true },
  ])(
    "denies service data to unauthorized actor %j before querying",
    async (actor) => {
      await expect(
        getFeedbackCount(actor as SessionActor | null),
      ).rejects.toMatchObject({ code: "forbidden", status: 403 });
      await expect(
        getFeedbackAnalytics(actor as SessionActor | null),
      ).rejects.toMatchObject({ code: "forbidden", status: 403 });
      expect(db.execute).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    },
  );

  it.each(["en", "ar"])(
    "uses the existing page authorization for %s",
    async (locale) => {
      for (const actor of [
        null,
        { kind: "registered" },
        { kind: "anonymous" },
      ]) {
        vi.mocked(getCurrentSession).mockResolvedValue(
          actor as SessionActor | null,
        );
        await expect(
          AdminFeedbackPage({ params: Promise.resolve({ locale }) }),
        ).rejects.toThrow(`redirect:/${locale}/login`);
      }
      vi.mocked(getCurrentSession).mockResolvedValue({
        kind: "admin",
        mustChangePassword: true,
      } as SessionActor);
      await expect(
        AdminFeedbackPage({ params: Promise.resolve({ locale }) }),
      ).rejects.toThrow(`redirect:/${locale}/admin/settings?required=1`);
      expect(db.transaction).not.toHaveBeenCalled();
    },
  );

  it("renders a localized error state for an authorized administrator without exposing a database error", async () => {
    vi.mocked(getCurrentSession).mockResolvedValue({
      kind: "admin",
      displayName: "Admin",
      mustChangePassword: false,
    } as SessionActor);
    vi.mocked(db.transaction).mockRejectedValueOnce(
      new Error("private SQL and credentials"),
    );
    const page = await AdminFeedbackPage({
      params: Promise.resolve({ locale: "ar" }),
    });
    expect(page.props.locale).toBe("ar");
    expect(page.props.data).toBeNull();
    expect(JSON.stringify(page.props)).not.toContain("private SQL");
  });
});
