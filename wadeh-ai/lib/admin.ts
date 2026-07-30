// Founder console credentials.
// The username is public; the password is stored ONLY as a SHA-256 hash so it
// cannot be read out of this (public) codebase. The plaintext was handed to
// the founder privately. To rotate: sha256 of the new password goes here.
// NOTE: this is a device-local console gate, not server security — real
// multi-user admin arrives with the auth backend.

export const ADMIN_USER = "wadeh-admin";
export const ADMIN_HASH = "096a55bead5c4310fb122347927b33aa97310a12e2c81b69e42ba2158796ece1";

export async function checkAdmin(user: string, password: string): Promise<boolean> {
  if (user.trim() !== ADMIN_USER) return false;
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === ADMIN_HASH;
}
