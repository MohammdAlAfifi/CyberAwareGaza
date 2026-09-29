export type ActorIdentity =
  | { kind: "admin" }
  | { kind: "registered" | "anonymous"; participantId: string };

export function isParticipantOwner(
  actor: ActorIdentity,
  participantId: string,
): boolean {
  return actor.kind !== "admin" && actor.participantId === participantId;
}
