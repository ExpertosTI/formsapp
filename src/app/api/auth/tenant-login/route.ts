import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-constants";
import { validateTenantCredentials, tenantSessionToken, TENANT_COOKIE } from "@/lib/tenant-auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const tenant = await validateTenantCredentials(email, password);
  if (!tenant) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, slug: tenant.slug, name: tenant.name });
  res.cookies.set(TENANT_COOKIE, tenantSessionToken(tenant.slug), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.delete(AUTH_COOKIE);
  return res;
}
