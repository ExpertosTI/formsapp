import { AdminShell } from "@/components/admin/AdminShell";
import { getTenantSession } from "@/lib/tenant-auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const tenantSlug = await getTenantSession();
  return <AdminShell tenantSlug={tenantSlug}>{children}</AdminShell>;
}
