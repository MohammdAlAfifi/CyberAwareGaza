import { hash } from "@node-rs/argon2";

import {
  createMaintenancePool,
  formatVerifiedTarget,
  verifyDatabaseConnection,
} from "./database-utils.mjs";

const username = "admin";
const displayName = "Administrator";

function readHidden(prompt) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "Administrator provisioning requires an interactive terminal",
    );
  }
  return new Promise((resolve, reject) => {
    let value = "";
    const input = process.stdin;
    const finish = (error) => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };
    const onData = (chunk) => {
      const text = chunk.toString("utf8");
      for (const character of text) {
        if (character === "\u0003")
          return finish(new Error("Provisioning cancelled"));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b")
          value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    };
    process.stdout.write(prompt);
    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });
}

const password = await readHidden("New password for admin: ");
const confirmation = await readHidden("Confirm password: ");
if (password !== confirmation) throw new Error("Passwords do not match");
const mustChangePassword = true;

if (!password || password.length < 8 || password.length > 128) {
  throw new Error("Password must be 8-128 characters");
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
                must_change_password = $5,
                updated_at = now()
          where id = $1`,
        [accountId, username, displayName, passwordHash, mustChangePassword],
      );
      action = "admin.credentials_rotated";
    } else {
      const inserted = await client.query(
        `insert into accounts (
           normalized_username, username, display_name, password_hash, role,
           must_change_password
         ) values ($1, $2, $3, $4, 'admin', $5)
         returning id`,
        [
          normalizedUsername,
          username,
          displayName,
          passwordHash,
          mustChangePassword,
        ],
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
      [
        accountId,
        action,
        JSON.stringify({
          method: "private_cli",
          password_change_required: mustChangePassword,
        }),
      ],
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
