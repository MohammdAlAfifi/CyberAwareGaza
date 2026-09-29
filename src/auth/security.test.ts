import { describe, expect, it } from "vitest";

import { createOpaqueToken, keyedHash } from "@/src/auth/crypto";
import { isParticipantOwner } from "@/src/auth/policy";
import { loginInputSchema, signupInputSchema } from "@/src/auth/validation";

describe("authentication security primitives", () => {
  it("creates high-entropy opaque tokens and deterministic keyed hashes", () => {
    const first = createOpaqueToken();
    const second = createOpaqueToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(43);
    expect(keyedHash(first, "a".repeat(32))).toMatch(/^[0-9a-f]{64}$/);
    expect(keyedHash(first, "a".repeat(32))).not.toBe(
      keyedHash(first, "b".repeat(32)),
    );
  });

  it("rejects role injection and mismatched signup passwords", () => {
    const base = {
      locale: "en",
      username: "student.one",
      displayName: "Student",
      password: "a sufficiently long password",
      confirmPassword: "a sufficiently long password",
    };
    expect(signupInputSchema.safeParse(base).success).toBe(true);
    expect(
      signupInputSchema.safeParse({ ...base, role: "admin" }).success,
    ).toBe(false);
    expect(
      signupInputSchema.safeParse({
        ...base,
        confirmPassword: "a different long password",
      }).success,
    ).toBe(false);
  });

  it("applies bounded credential input validation", () => {
    expect(
      loginInputSchema.safeParse({
        locale: "ar",
        username: "مشارك_1",
        password: "a sufficiently long password",
      }).success,
    ).toBe(true);
    expect(
      loginInputSchema.safeParse({
        locale: "en",
        username: "ab",
        password: "short",
      }).success,
    ).toBe(false);
  });

  it("allows only exact participant ownership", () => {
    expect(
      isParticipantOwner(
        { kind: "registered", participantId: "participant-a" },
        "participant-a",
      ),
    ).toBe(true);
    expect(
      isParticipantOwner(
        { kind: "registered", participantId: "participant-a" },
        "participant-b",
      ),
    ).toBe(false);
    expect(
      isParticipantOwner(
        { kind: "anonymous", participantId: "anonymous-a" },
        "anonymous-b",
      ),
    ).toBe(false);
    expect(isParticipantOwner({ kind: "admin" }, "participant-a")).toBe(false);
  });
});
