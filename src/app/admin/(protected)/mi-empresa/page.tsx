import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { TenantBrandingForm } from "@/components/admin/TenantBrandingForm";
import type { TenantSettings } from "@/lib/form-config";

export const dynamic = "force-dynamic";

export default async function MiEmpresaPage() {
  const { isSuperAdmin, tenantSlug } = await getSessionContext();

  if (isSuperAdmin && !tenantSlug) {
    redirect("/admin/empresas");
  }
  if (!tenantSlug) {
    redirect("/admin/login");
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) redirect("/admin/login");

  return (
    <div className="max-w-2xl mx-auto">
      <header className="tl-page-header">
        <h1 className="tl-page-title">Mi empresa</h1>
        <p className="tl-page-sub">
          Personaliza logo, colores y datos que ven los candidatos en tu formulario
        </p>
      </header>

      <TenantBrandingForm
        tenant={{
          slug: tenant.slug,
          name: tenant.name,
          logo: tenant.logo,
          senderName: tenant.senderName,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor,
          backgroundColor: tenant.backgroundColor,
          settings: (tenant.settings ?? {}) as TenantSettings,
        }}
      />
    </div>
  );
}
