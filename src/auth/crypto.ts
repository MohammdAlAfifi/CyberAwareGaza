import { createHmac, randomBytes } from "node:crypto";

export function createOpaqueToken(): string {
  return randomBytes(32).toString("base64url");
}

export function keyedHash(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}
