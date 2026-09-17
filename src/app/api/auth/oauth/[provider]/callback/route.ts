import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, TENANT_COOKIE } from "@/lib/auth-constants";
import { tenantSessionToken } from "@/lib/session";
import { slugify } from "@/lib/slug";

type OAuthProfile = { email: string; name?: string; provider: "google" | "apple" };

async function exchangeGoogleCode(code: string, redirectUri: string): Promise<OAuthProfile | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return null;
  const tokens = await tokenRes.json();
  const accessToken = tokens.access_token as string | undefined;
  if (!accessToken) return null;

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) return null;
  const profile = await profileRes.json();
  if (!profile.email) return null;
  return {
    email: String(profile.email).toLowerCase(),
    name: profile.name ? String(profile.name) : undefined,
    provider: "google",
  };
}

async function loginOrProvisionTenant(profile: OAuthProfile) {
  let tenant = await prisma.tenant.findFirst({
    where: { adminEmail: { equals: profile.email, mode: "insensitive" }, active: true },
  });

  if (!tenant) {
    // Auto-crea empresa mínima para no bloquear al cliente
    const baseName = profile.name?.split(" ")[0] || profile.email.split("@")[0] || "empresa";
    let slug = slugify(`${baseName}-hr`);
    const taken = await prisma.tenant.findUnique({ where: { slug } });
    if (taken) slug = slugify(`${baseName}-${Date.now().toString(36)}`);

    const randomPass = await bcrypt.hash(`${profile.email}:${Date.now()}`, 10);
    tenant = await prisma.tenant.create({
      data: {
        name: profile.name || `Empresa ${baseName}`,
        slug,
        adminEmail: profile.email,
        adminPassword: randomPass,
        active: true,
        settings: {
          formType: "simple",
          registeredVia: `oauth-${profile.provider}`,
        },
      },
    });
  }

  return tenant;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  let returnTo = "/admin";
  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
      if (parsed?.returnTo) returnTo = String(parsed.returnTo);
    }
  } catch {
    /* ignore */
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?oauth=cancelled", base));
  }

  if (provider === "google") {
    const redirectUri = `${base}/api/auth/oauth/google/callback`;
    const profile = await exchangeGoogleCode(code, redirectUri);
    if (!profile) {
      return NextResponse.redirect(new URL("/admin/login?oauth=google_error", base));
    }
    const tenant = await loginOrProvisionTenant(profile);
    const res = NextResponse.redirect(new URL(`${returnTo}?empresa=${tenant.slug}`, base));
    res.cookies.delete(AUTH_COOKIE);
    res.cookies.set(TENANT_COOKIE, tenantSessionToken(tenant.slug), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  }

  // Apple usa form_post → POST handler
  return NextResponse.redirect(new URL("/admin/login?oauth=apple_use_post", base));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (provider !== "apple") {
    return NextResponse.redirect(new URL("/admin/login?oauth=unsupported", base));
  }

  // Apple Sign In requiere JWT client secret firmado (APPLE_*).
  // Hasta configurar las keys, devolvemos mensaje claro.
  if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_PRIVATE_KEY) {
    return NextResponse.redirect(new URL("/admin/login?oauth=apple_pending", base));
  }

  const form = await req.formData();
  const idToken = String(form.get("id_token") || "");
  if (!idToken) {
    return NextResponse.redirect(new URL("/admin/login?oauth=apple_error", base));
  }

  // Decodifica payload del JWT (sin verificar firma aquí; en prod conviene JWKS de Apple)
  try {
    const payload = JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"));
    const email = String(payload.email || "").toLowerCase();
    if (!email) {
      return NextResponse.redirect(new URL("/admin/login?oauth=apple_no_email", base));
    }
    const tenant = await loginOrProvisionTenant({ email, provider: "apple" });
    const res = NextResponse.redirect(new URL(`/admin/candidatos?empresa=${tenant.slug}`, base));
    res.cookies.delete(AUTH_COOKIE);
    res.cookies.set(TENANT_COOKIE, tenantSessionToken(tenant.slug), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL("/admin/login?oauth=apple_error", base));
  }
}
