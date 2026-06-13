import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, sessionToken, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pw = String(form.get("password") || "");
  const next = String(form.get("next") || "/admin");
  const dest = next.startsWith("/") ? next : "/admin";

  if (!verifyPassword(pw)) {
    return NextResponse.redirect(new URL("/admin?error=1", req.url), { status: 303 });
  }

  const res = NextResponse.redirect(new URL(dest, req.url), { status: 303 });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
