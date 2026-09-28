import { describe, expect, it } from "vitest";

import {
  formatAnonymousLabel,
  formatParticipantCode,
  participantDisplayName,
} from "./identifiers";

describe("participant identifiers", () => {
  it.each([
    [1, "CAG-0001"],
    [42, "CAG-0042"],
    [9999, "CAG-9999"],
    [10000, "CAG-10000"],
  ])("formats public ordinal %i", (ordinal, expected) => {
    expect(formatParticipantCode(ordinal)).toBe(expected);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid ordinal %s",
    (ordinal) => {
      expect(() => formatParticipantCode(ordinal)).toThrow(RangeError);
    },
  );

  it("formats the stable anonymous label", () => {
    expect(formatAnonymousLabel(7)).toBe("Anonymous 7");
  });
});

describe("participantDisplayName", () => {
  it("prefers a registered display name over username", () => {
    expect(
      participantDisplayName({
        type: "registered",
        displayName: "  Lina  ",
        username: "lina",
        publicCode: "CAG-0001",
      }),
    ).toBe("Lina");
  });

  it("falls back to username for a registered participant", () => {
    expect(
      participantDisplayName({
        type: "registered",
        username: "lina",
        publicCode: "CAG-0001",
      }),
    ).toBe("lina");
  });

  it("uses the anonymous label for an anonymous participant", () => {
    expect(
      participantDisplayName({
        type: "anonymous",
        anonymousOrdinal: 9,
        publicCode: "CAG-0009",
      }),
    ).toBe("Anonymous 9");
  });

  it("uses the public code for an imported participant", () => {
    expect(
      participantDisplayName({ type: "imported", publicCode: "CAG-0100" }),
    ).toBe("CAG-0100");
  });
});
