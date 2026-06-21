import crypto from "node:crypto";

/** Admin password for /admin. Defaults to "aigency" for demo — CHANGE in prod. */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "aigency";

export const ADMIN_COOKIE = "aff_admin";

/** Deterministic session token derived from the password (not the password itself). */
export function sessionToken(): string {
  return crypto.createHmac("sha256", ADMIN_PASSWORD).update("aff-admin-v1").digest("hex");
}

export function verifyPassword(pw: string): boolean {
  if (!pw) return false;
  const a = Buffer.from(pw);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;
  const expected = sessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** True when the admin password is still the demo default. */
export function usingDefaultPassword(): boolean {
  return !process.env.ADMIN_PASSWORD;
}
