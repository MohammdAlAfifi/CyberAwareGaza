export function formatParticipantCode(ordinal: number): string {
  assertPositiveOrdinal(ordinal);
  return `CAG-${ordinal.toString().padStart(4, "0")}`;
}

export function formatAnonymousLabel(ordinal: number): string {
  assertPositiveOrdinal(ordinal);
  return `Anonymous ${ordinal}`;
}

export function participantDisplayName(input: {
  type: "registered" | "anonymous" | "imported";
  displayName?: string | null;
  username?: string | null;
  anonymousOrdinal?: number | null;
  publicCode: string;
}): string {
  const displayName = input.displayName?.trim();
  if (input.type === "registered" && displayName) return displayName;

  const username = input.username?.trim();
  if (input.type === "registered" && username) return username;

  if (
    (input.type === "anonymous" || input.type === "imported") &&
    input.anonymousOrdinal != null
  ) {
    return formatAnonymousLabel(input.anonymousOrdinal);
  }

  return input.publicCode;
}

function assertPositiveOrdinal(ordinal: number): void {
  if (!Number.isSafeInteger(ordinal) || ordinal < 1) {
    throw new RangeError("Ordinal must be a positive safe integer");
  }
}
