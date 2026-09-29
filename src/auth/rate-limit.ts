import "server-only";

import { sql } from "drizzle-orm";

import { keyedHash } from "@/src/auth/crypto";
import { AuthError } from "@/src/auth/errors";
import { db } from "@/src/db";
import { env } from "@/src/lib/env";

const limits = {
  signup: { attempts: 5, windowSeconds: 15 * 60 },
  login: { attempts: 10, windowSeconds: 15 * 60 },
  loginIp: { attempts: 30, windowSeconds: 15 * 60 },
  anonymous: { attempts: 10, windowSeconds: 60 * 60 },
  adminLogin: { attempts: 5, windowSeconds: 15 * 60 },
  adminLoginIp: { attempts: 20, windowSeconds: 15 * 60 },
} as const;

export type RateLimitBucket = keyof typeof limits;

export async function consumeRateLimit(
  bucket: RateLimitBucket,
  identifier: string,
): Promise<void> {
  const policy = limits[bucket];
  const keyHash = keyedHash(`${bucket}:${identifier}`, env.SESSION_SECRET);
  const interval = `${policy.windowSeconds} seconds`;
  const result = await db.execute<{ attempts: number }>(sql`
    insert into rate_limits (
      bucket, key_hash, window_started_at, attempts, expires_at
    ) values (
      ${bucket}, ${keyHash}, now(), 1, now() + ${interval}::interval
    )
    on conflict (bucket, key_hash) do update set
      window_started_at = case
        when rate_limits.expires_at <= now() then now()
        else rate_limits.window_started_at
      end,
      attempts = case
        when rate_limits.expires_at <= now() then 1
        else rate_limits.attempts + 1
      end,
      expires_at = case
        when rate_limits.expires_at <= now() then now() + ${interval}::interval
        else rate_limits.expires_at
      end
    returning attempts
  `);

  const attempts = Number(result.rows[0]?.attempts ?? policy.attempts + 1);
  if (attempts > policy.attempts) {
    throw new AuthError("rate_limited", 429);
  }
}

export async function clearRateLimit(
  bucket: RateLimitBucket,
  identifier: string,
): Promise<void> {
  const keyHash = keyedHash(`${bucket}:${identifier}`, env.SESSION_SECRET);
  await db.execute(
    sql`delete from rate_limits where bucket = ${bucket} and key_hash = ${keyHash}`,
  );
}
