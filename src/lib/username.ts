import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(40)
  .regex(
    /^[\p{L}\p{N}._-]+$/u,
    "Use letters, numbers, dots, underscores, or hyphens",
  );

export function normalizeUsername(username: string): string {
  return username.trim().normalize("NFKC").toLocaleLowerCase("en-US");
}
