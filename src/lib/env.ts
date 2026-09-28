import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  APP_ORIGINS: z.string().min(1),
  APP_TIMEZONE: z.string().default("Asia/Hebron"),
  ANONYMOUS_SESSION_HOURS: z.coerce.number().int().positive().default(24),
  REGISTERED_SESSION_DAYS: z.coerce.number().int().positive().default(30)
});

export const env = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_ORIGINS: process.env.APP_ORIGINS,
  APP_TIMEZONE: process.env.APP_TIMEZONE,
  ANONYMOUS_SESSION_HOURS: process.env.ANONYMOUS_SESSION_HOURS,
  REGISTERED_SESSION_DAYS: process.env.REGISTERED_SESSION_DAYS
});
