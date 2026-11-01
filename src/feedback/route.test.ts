import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/src/lib/env", () => ({
  env: { APP_ORIGINS: ["http://localhost:3000"] },
}));
vi.mock("@/src/auth/sessions", () => ({
  getSessionByToken: vi.fn(),
  SESSION_COOKIE: "cag_session",
}));
vi.mock("@/src/feedback/service", () => ({
  submitAssessmentFeedback: vi.fn(),
}));

import { POST } from "@/app/api/assessment/feedback/route";
import { AssessmentError } from "@/src/assessment/errors";
import { getSessionByToken, type SessionActor } from "@/src/auth/sessions";
import { submitAssessmentFeedback } from "./service";

function request(
  options: {
    origin?: string;
    site?: string;
    cookie?: boolean;
    body?: string;
  } = {},
) {
  return new NextRequest("http://localhost:3000/api/assessment/feedback", {
    method: "POST",
    headers: {
      origin: options.origin ?? "http://localhost:3000",
      "sec-fetch-site": options.site ?? "same-origin",
      "content-type": "application/json",
      ...(options.cookie === false ? {} : { cookie: "cag_session=test-token" }),
    },
    body: options.body ?? JSON.stringify({ attemptId: "test-attempt" }),
  });
}

beforeEach(() => vi.resetAllMocks());

describe("feedback mutation protection", () => {
  it.each(["registered", "anonymous"] as const)(
    "uses the %s server-session participant",
    async (kind) => {
      vi.mocked(getSessionByToken).mockResolvedValue({
        kind,
        participantId: "session-owner",
      } as SessionActor);
      const response = await POST(request());
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(submitAssessmentFeedback).toHaveBeenCalledWith("session-owner", {
        attemptId: "test-attempt",
      });
    },
  );

  it("rejects absent, expired and admin sessions", async () => {
    expect((await POST(request({ cookie: false }))).status).toBe(401);
    vi.mocked(getSessionByToken).mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    vi.mocked(getSessionByToken).mockResolvedValue({
      kind: "admin",
    } as SessionActor);
    expect((await POST(request())).status).toBe(401);
    expect(submitAssessmentFeedback).not.toHaveBeenCalled();
  });

  it("rejects untrusted or missing origins and cross-site requests before reading sessions", async () => {
    for (const options of [
      { origin: "https://untrusted.example" },
      { origin: "" },
      { site: "cross-site" },
    ]) {
      expect((await POST(request(options))).status).toBe(403);
    }
    expect(getSessionByToken).not.toHaveBeenCalled();
    expect(submitAssessmentFeedback).not.toHaveBeenCalled();
  });

  it("returns validation and ownership errors without leaking storage errors", async () => {
    vi.mocked(getSessionByToken).mockResolvedValue({
      kind: "anonymous",
      participantId: "owner",
    } as SessionActor);
    expect((await POST(request({ body: "{" }))).status).toBe(400);
    for (const [code, status] of [
      ["invalid_input", 400],
      ["attempt_not_found", 404],
    ] as const) {
      vi.mocked(submitAssessmentFeedback).mockRejectedValueOnce(
        new AssessmentError(code, status),
      );
      const response = await POST(request());
      expect(response.status).toBe(status);
      expect(await response.json()).toEqual({ ok: false, code });
    }
    vi.mocked(submitAssessmentFeedback).mockRejectedValueOnce(
      new Error("private SQL and credentials"),
    );
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ ok: false, code: "server_error" });
  });
});
