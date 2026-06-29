import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-constants";
import { validateCredentials } from "@/lib/auth-credentials";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!validateCredentials(email, password)) {
    const creds = process.env.SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD;
    if (!creds && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
    }
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(AUTH_COOKIE, "dev-session", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return res;
    }
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return res;
}
