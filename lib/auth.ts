import { cookies } from "next/headers";
import { USERS, userByEmail, type DemoUser } from "./data/users";

const COOKIE = "fnb_session";

export function setSession(email: string) {
  cookies().set(COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSession() {
  cookies().delete(COOKIE);
}

export function currentUser(): DemoUser | null {
  const email = cookies().get(COOKIE)?.value;
  if (!email) return null;
  return userByEmail(email) ?? null;
}

export function demoCredentials() {
  return USERS.map((u) => ({ email: u.email, role: u.role, name: u.name }));
}
