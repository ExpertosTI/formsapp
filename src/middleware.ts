import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, TENANT_COOKIE } from "@/lib/auth-constants";

function parseTenantToken(token: string | undefined, secret: string | undefined): string | null {
  if (!token || !secret || !token.startsWith("tenant_")) return null;
  const suffix = `_${secret}`;
  if (!token.endsWith(suffix)) return null;
  const slug = token.slice("tenant_".length, -suffix.length);
  return slug || null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const superToken = req.cookies.get(AUTH_COOKIE)?.value;
    const superValid =
      (secret && superToken === secret) ||
      (!secret && process.env.NODE_ENV !== "production" && superToken === "dev-session");

    const tenantSlug = parseTenantToken(req.cookies.get(TENANT_COOKIE)?.value, secret);

    if (!superValid && !tenantSlug) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    if (tenantSlug && (pathname.startsWith("/admin/empresas") || pathname === "/admin")) {
      return NextResponse.redirect(new URL(`/admin/candidatos?empresa=${tenantSlug}`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
