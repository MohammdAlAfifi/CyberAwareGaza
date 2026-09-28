import "server-only";

import { z } from "zod";

const postgresUrl = z
  .string()
  .url()
  .refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "postgres:" || protocol === "postgresql:";
  }, "Must be a PostgreSQL connection URL");

const trustedOrigins = z
  .string()
  .min(1)
  .transform((value, context) => {
    const origins = value
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean);

    for (const origin of origins) {
      try {
        const url = new URL(origin);
        if (
          (url.protocol !== "http:" && url.protocol !== "https:") ||
          url.origin !== origin
        ) {
          throw new Error("Invalid origin");
        }
      } catch {
        context.addIssue({
          code: "custom",
          message: `Invalid APP_ORIGINS entry: ${origin}`,
        });
      }
    }

    return origins;
  });

const serverEnvSchema = z.object({
  DATABASE_URL: postgresUrl,
  SUPABASE_CA_CERT_PATH: z.string().trim().min(1).optional(),
  SESSION_SECRET: z
    .string()
    .min(32)
    .refine(
      (value) => !value.toLowerCase().includes("replace"),
      "Generate a real session secret",
    ),
  APP_ORIGINS: trustedOrigins,
  APP_TIMEZONE: z.string().default("Asia/Hebron"),
  ANONYMOUS_SESSION_HOURS: z.coerce.number().int().positive().default(24),
  REGISTERED_SESSION_DAYS: z.coerce.number().int().positive().default(30),
});

export const env = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_CA_CERT_PATH: process.env.SUPABASE_CA_CERT_PATH,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_ORIGINS: process.env.APP_ORIGINS,
  APP_TIMEZONE: process.env.APP_TIMEZONE,
  ANONYMOUS_SESSION_HOURS: process.env.ANONYMOUS_SESSION_HOURS,
  REGISTERED_SESSION_DAYS: process.env.REGISTERED_SESSION_DAYS,
});
