import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth-constants";
import { TENANT_COOKIE } from "@/lib/tenant-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(AUTH_COOKIE);
  res.cookies.delete(TENANT_COOKIE);
  return res;
}
