import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { TENANT_COOKIE } from "./auth-constants";
import { prisma } from "./prisma";
import { parseTenantToken, tenantSessionToken } from "./session";

export { TENANT_COOKIE };
export { tenantSessionToken };

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

export async function getTenantSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(TENANT_COOKIE)?.value;
  const slug = parseTenantToken(raw, process.env.ADMIN_SESSION_SECRET);
  if (!slug) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug, active: true } });
  return tenant ? slug : null;
}
