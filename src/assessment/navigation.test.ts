import { describe, expect, it } from "vitest";

import { assessmentScenarioPath } from "./navigation";

describe("bilingual assessment navigation", () => {
  it("keeps the same scenario when the locale changes", () => {
    expect(assessmentScenarioPath("en", 6)).toBe("/en/assessment?scenario=6");
    expect(assessmentScenarioPath("ar", 6)).toBe("/ar/assessment?scenario=6");
  });

  it("keeps scenario navigation inside the supported range", () => {
    expect(assessmentScenarioPath("en", 0)).toMatch(/scenario=1$/);
    expect(assessmentScenarioPath("ar", 12)).toMatch(/scenario=8$/);
  });
});
