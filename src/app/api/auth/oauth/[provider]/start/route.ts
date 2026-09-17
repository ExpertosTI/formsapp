import { NextRequest, NextResponse } from "next/server";

/**
 * Google / Apple OAuth start.
 * Configura en .env:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY
 *   NEXT_PUBLIC_APP_URL=https://forms.renace.tech
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const returnTo = req.nextUrl.searchParams.get("returnTo") || "/admin";
  const base = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        new URL(`/admin/login?oauth=google_pending`, base)
      );
    }
    const redirectUri = `${base}/api/auth/oauth/google/callback`;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("access_type", "online");
    url.searchParams.set("prompt", "select_account");
    url.searchParams.set("state", Buffer.from(JSON.stringify({ returnTo })).toString("base64url"));
    return NextResponse.redirect(url.toString());
  }

  if (provider === "apple") {
    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.redirect(
        new URL(`/admin/login?oauth=apple_pending`, base)
      );
    }
    const redirectUri = `${base}/api/auth/oauth/apple/callback`;
    const url = new URL("https://appleid.apple.com/auth/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code id_token");
    url.searchParams.set("response_mode", "form_post");
    url.searchParams.set("scope", "name email");
    url.searchParams.set("state", Buffer.from(JSON.stringify({ returnTo })).toString("base64url"));
    return NextResponse.redirect(url.toString());
  }

  return NextResponse.redirect(new URL("/admin/login?oauth=unsupported", base));
}
