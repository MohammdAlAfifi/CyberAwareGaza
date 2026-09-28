import { describe, expect, it } from "vitest";
import { escapeSpreadsheetFormula } from "./csv";

describe("CSV formula escaping", () => {
  it.each(["=SUM(A1:A2)", "+cmd", "-1+2", "@link", "\tpayload"])(
    "escapes %s",
    (value) => expect(escapeSpreadsheetFormula(value)).toBe(`'${value}`),
  );

  it("preserves ordinary values", () => {
    expect(escapeSpreadsheetFormula("CAG-0001")).toBe("CAG-0001");
  });
});
