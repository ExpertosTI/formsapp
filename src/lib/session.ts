import { cookies } from "next/headers";
import { AUTH_COOKIE, TENANT_COOKIE } from "./auth-constants";
import { prisma } from "./prisma";

export function parseTenantToken(token: string | undefined, secret: string | undefined): string | null {
  if (!token || !secret || !token.startsWith("tenant_")) return null;
  const suffix = `_${secret}`;
  if (!token.endsWith(suffix)) return null;
  const slug = token.slice("tenant_".length, -suffix.length);
  return slug || null;
}

export function tenantSessionToken(slug: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "dev";
  return `tenant_${slug}_${secret}`;
}

export interface SessionContext {
  isSuperAdmin: boolean;
  tenantSlug: string | null;
}

export async function getSessionContext(): Promise<SessionContext> {
  const cookieStore = await cookies();
  const secret = process.env.ADMIN_SESSION_SECRET;
  const superToken = cookieStore.get(AUTH_COOKIE)?.value;

  const isSuperAdmin =
    (secret && superToken === secret) ||
    (!secret && process.env.NODE_ENV !== "production" && superToken === "dev-session");

  const tenantSlug = parseTenantToken(cookieStore.get(TENANT_COOKIE)?.value, secret);

  return { isSuperAdmin, tenantSlug };
}

/** Requiere super admin o tenant con acceso al submission */
export async function assertSubmissionAccess(submissionId: string): Promise<
  | { ok: true; tenantSlug: string | null; isSuperAdmin: boolean }
  | { ok: false; status: number; error: string }
> {
  const { isSuperAdmin, tenantSlug } = await getSessionContext();
  if (!isSuperAdmin && !tenantSlug) {
    return { ok: false, status: 401, error: "No autorizado" };
  }

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { tenant: { select: { slug: true } } },
  });
  if (!sub) return { ok: false, status: 404, error: "No encontrado" };

  if (!isSuperAdmin && sub.tenant.slug !== tenantSlug) {
    return { ok: false, status: 403, error: "Sin permiso" };
  }

  return { ok: true, tenantSlug, isSuperAdmin };
}
