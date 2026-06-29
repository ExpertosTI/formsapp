import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { TENANT_COOKIE } from "./auth-constants";
import { prisma } from "./prisma";

export { TENANT_COOKIE };

export function verifyTenantPassword(plain: string, hash: string): boolean {
  if (!hash) return false;
  const normalized = hash.startsWith("$2y$") ? `$2a$${hash.slice(4)}` : hash;
  return bcrypt.compareSync(plain, normalized);
}

export async function validateTenantCredentials(
  email: string,
  password: string
): Promise<{ slug: string; name: string } | null> {
  const tenant = await prisma.tenant.findFirst({
    where: {
      adminEmail: { equals: email.trim(), mode: "insensitive" },
      active: true,
    },
  });
  if (!tenant || !verifyTenantPassword(password, tenant.adminPassword)) return null;
  return { slug: tenant.slug, name: tenant.name };
}

export function tenantSessionToken(slug: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "dev";
  return `tenant_${slug}_${secret}`;
}

export async function getTenantSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TENANT_COOKIE)?.value;
  if (!raw?.startsWith("tenant_")) return null;
  const slug = raw.split("_")[1];
  if (!slug || raw !== tenantSessionToken(slug)) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug, active: true } });
  return tenant ? slug : null;
}
