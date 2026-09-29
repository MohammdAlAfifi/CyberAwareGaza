import { describe, expect, it } from "vitest";

import { getDictionary } from "./i18n";

function shapeOf(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(shapeOf);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, shapeOf(child)]),
    );
  }

  return typeof value;
}

describe("bilingual interface dictionaries", () => {
  it("keeps English and Arabic keys and collection lengths aligned", () => {
    expect(shapeOf(getDictionary("ar"))).toEqual(shapeOf(getDictionary("en")));
  });

  it("contains no blank interface strings", () => {
    for (const locale of ["en", "ar"] as const) {
      const serialized = JSON.stringify(getDictionary(locale));
      expect(serialized).not.toContain('\"\"');
    }
  });
});
