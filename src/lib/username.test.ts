import { describe, expect, it } from "vitest";
import { normalizeUsername, usernameSchema } from "./username";

describe("username normalization", () => {
  it("normalizes case, whitespace, and Unicode width", () => {
    expect(normalizeUsername("  ＡLI_2026 ")).toBe("ali_2026");
  });

  it("accepts Arabic letters", () => {
    expect(usernameSchema.safeParse("طالب_غزة").success).toBe(true);
  });
});
