import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExternalLink, Users, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { submissions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto">
      <header className="tl-page-header">
        <h1 className="tl-page-title">Empresas</h1>
        <p className="tl-page-sub">{tenants.length} organizaciones · datos sincronizados</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 tl-stagger">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="p-6 tl-card-hover">
            <div className="flex items-start justify-between">
              <div
                className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.accentColor})`,
                }}
              >
                {tenant.name.charAt(0)}
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  tenant.active ? "bg-teal-500/20 text-teal-300" : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {tenant.active ? "Activa" : "Inactiva"}
              </span>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-white">{tenant.name}</h2>
            <p className="text-sm text-slate-500">{tenant.slug}</p>
            <div className="flex gap-4 mt-3 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {tenant._count.submissions}
              </span>
              <span className="flex items-center gap-1 truncate">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{tenant.adminEmail}</span>
              </span>
            </div>
            <div className="flex flex-col gap-2 mt-5 sm:flex-row">
              <Link
                href={`/admin/candidatos?empresa=${tenant.slug}`}
                className="flex-1 py-2.5 text-xs font-semibold text-center text-white rounded-xl bg-white/[0.06] hover:bg-white/10 transition-all duration-300"
              >
                Candidatos
              </Link>
              <Link
                href={`/forms/${tenant.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold rounded-xl bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-all duration-300"
              >
                <ExternalLink className="w-3 h-3" />
                Form
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
