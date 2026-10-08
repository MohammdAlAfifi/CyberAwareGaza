import { describe, expect, it } from "vitest";

import { assessmentCompletionPath, assessmentScenarioPath } from "./navigation";

describe("bilingual assessment navigation", () => {
  it("keeps the same scenario when the locale changes", () => {
    expect(assessmentScenarioPath("en", 6)).toBe("/en/assessment?scenario=6");
    expect(assessmentScenarioPath("ar", 6)).toBe("/ar/assessment?scenario=6");
  });

  it("keeps scenario navigation inside the supported range", () => {
    expect(assessmentScenarioPath("en", 0)).toMatch(/scenario=1$/);
    expect(assessmentScenarioPath("ar", 12)).toMatch(/scenario=8$/);
  });

  it("keeps the completed attempt reference in localized completion routes", () => {
    const attemptId = "6aa7fbeb-dcd3-4895-baf7-2e7960d33046";

    expect(assessmentCompletionPath("en", attemptId)).toBe(
      `/en/assessment/completed/${attemptId}`,
    );
    expect(assessmentCompletionPath("ar", attemptId)).toBe(
      `/ar/assessment/completed/${attemptId}`,
    );
  });
});
