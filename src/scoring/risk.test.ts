import { describe, expect, it } from "vitest";
import { classifyRisk } from "./risk";

describe("classifyRisk", () => {
  it.each([
    [9, "high"],
    [10, "medium"],
    [24, "medium"],
    [25, "low"]
  ] as const)("classifies boundary score %i as %s", (score, expected) => {
    expect(classifyRisk(score)).toBe(expected);
  });

  it("supports negative scores without inventing a lower bound", () => {
    expect(classifyRisk(-1)).toBe("high");
  });

  it("rejects fractional scores", () => {
    expect(() => classifyRisk(10.5)).toThrow(TypeError);
  });
});
