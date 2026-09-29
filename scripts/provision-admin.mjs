import { hash } from "@node-rs/argon2";

import {
  createMaintenancePool,
  formatVerifiedTarget,
  verifyDatabaseConnection,
} from "./database-utils.mjs";

const username = process.env.ADMIN_USERNAME?.trim().normalize("NFKC");
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_DISPLAY_NAME?.trim() || null;

if (
  !username ||
  username.length < 3 ||
  username.length > 40 ||
  !/^[\p{L}\p{N}._-]+$/u.test(username)
) {
  throw new Error(
    "ADMIN_USERNAME must be 3-40 letters, numbers, dots, underscores, or hyphens",
  );
}
if (!password || password.length < 12 || password.length > 128) {
  throw new Error("ADMIN_PASSWORD must be 12-128 characters");
}
if (displayName && displayName.length > 120) {
  throw new Error("ADMIN_DISPLAY_NAME must be at most 120 characters");
}

const normalizedUsername = username.toLocaleLowerCase("en-US");
const passwordHash = await hash(password, {
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
});
const pool = createMaintenancePool();

try {
  const target = await verifyDatabaseConnection(pool, "DIRECT_DATABASE_URL");
  const client = await pool.connect();
  let action;
  try {
    await client.query("begin");
    const existing = await client.query(
      `select id, role
         from accounts
        where normalized_username = $1
        for update`,
      [normalizedUsername],
    );

    let accountId;
    if (existing.rows.length > 0) {
      if (existing.rows[0].role !== "admin") {
        throw new Error(
          "That username belongs to a participant and cannot be converted to an administrator",
        );
      }
      accountId = existing.rows[0].id;
      await client.query(
        `update accounts
            set username = $2,
                display_name = $3,
                password_hash = $4,
                password_changed_at = now(),
                updated_at = now()
          where id = $1`,
        [accountId, username, displayName, passwordHash],
      );
      action = "admin.credentials_rotated";
    } else {
      const inserted = await client.query(
        `insert into accounts (
           normalized_username, username, display_name, password_hash, role
         ) values ($1, $2, $3, $4, 'admin')
         returning id`,
        [normalizedUsername, username, displayName, passwordHash],
      );
      accountId = inserted.rows[0].id;
      action = "admin.provisioned";
    }

    await client.query(
      `update sessions
          set revoked_at = now()
        where account_id = $1 and revoked_at is null`,
      [accountId],
    );
    await client.query(
      `insert into admin_audit (actor_account_id, action, metadata)
       values ($1, $2, $3::jsonb)`,
      [accountId, action, JSON.stringify({ method: "private_cli" })],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  console.log(
    `Administrator ${username} provisioned through ${formatVerifiedTarget(target)}. Existing sessions were revoked.`,
  );
} finally {
  await pool.end();
}
