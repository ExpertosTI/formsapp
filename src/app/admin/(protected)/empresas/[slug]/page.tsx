import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/session";
import { TenantBrandingForm } from "@/components/admin/TenantBrandingForm";
import type { TenantSettings } from "@/lib/form-config";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EmpresaEditPage({ params }: Props) {
  const { slug } = await params;
  const { isSuperAdmin, tenantSlug } = await getSessionContext();

  if (!isSuperAdmin) {
    if (tenantSlug === slug) redirect("/admin/mi-empresa");
    redirect("/admin/candidatos");
  }

  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/admin/empresas"
        className="inline-flex items-center gap-1.5 mb-4 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Todas las empresas
      </Link>

      <header className="tl-page-header">
        <h1 className="tl-page-title">Personalizar empresa</h1>
        <p className="tl-page-sub">
          Logo, colores y textos de <span className="text-teal-400">{tenant.name}</span>
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
