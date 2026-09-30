import { describe, expect, it } from "vitest";

import { scenarioKeys } from "./content";
import { consentAllowsAssessment, hasCompleteAnswerSet } from "./rules";

describe("assessment consent and submission rules", () => {
  it("only permits an explicit affirmative consent decision", () => {
    expect(consentAllowsAssessment(true)).toBe(true);
    expect(consentAllowsAssessment(false)).toBe(false);
  });

  it("requires one answer for every scenario before submission", () => {
    const complete = scenarioKeys.map((scenarioKey) => ({
      scenarioKey,
      optionId: `${scenarioKey}O1`,
    }));
    expect(hasCompleteAnswerSet(complete)).toBe(true);
    expect(hasCompleteAnswerSet(complete.slice(0, 7))).toBe(false);
    expect(hasCompleteAnswerSet([...complete.slice(0, 7), complete[0]])).toBe(
      false,
    );
  });
});
