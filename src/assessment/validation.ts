import { z } from "zod";

export const consentDecisionSchema = z.object({
  decision: z.boolean(),
  idempotencyKey: z.uuid(),
});

export const progressInputSchema = z.object({
  attemptId: z.uuid(),
  scenarioKey: z.enum(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]),
  optionId: z.string().trim().min(1).max(48),
});

export const submitInputSchema = z.object({
  attemptId: z.uuid(),
});
