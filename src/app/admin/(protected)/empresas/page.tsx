import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExternalLink, Users, Mail, Palette } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const tenants = await prisma.tenant.findMany({
    include: { _count: { select: { submissions: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white">Empresas</h1>
        <p className="mt-1 text-slate-400">
          Gestión centralizada de tenants. Los datos históricos se conservan siempre.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="p-6 glass-card">
            <div className="flex items-start justify-between">
              <div
                className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.accentColor})`,
                }}
              >
                {tenant.name.charAt(0)}
              </div>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  tenant.active
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-slate-500/20 text-slate-400"
                }`}
              >
                {tenant.active ? "Activa" : "Inactiva"}
              </span>
            </div>

            <h2 className="mt-4 text-lg font-bold text-white">{tenant.name}</h2>
            <p className="text-sm text-slate-500">{tenant.slug}</p>

            <div className="grid gap-2 mt-4 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {tenant.adminEmail}
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {tenant._count.submissions} candidatos
              </span>
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {tenant.primaryColor} / {tenant.accentColor}
              </span>
            </div>

            <div className="flex gap-2 mt-5">
              <Link
                href={`/admin/candidatos?empresa=${tenant.slug}`}
                className="flex-1 px-4 py-2 text-xs font-bold text-center text-white rounded-lg bg-white/10 hover:bg-white/15"
              >
                Ver candidatos
              </Link>
              <Link
                href={`/forms/${tenant.slug}`}
                target="_blank"
                className="flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30"
              >
                <ExternalLink className="w-3 h-3" />
                Formulario
              </Link>
            </div>
          </div>
        ))}
      </div>

      {tenants.length === 0 && (
        <div className="p-12 text-center glass-card">
          <p className="text-slate-400">No hay empresas registradas. Ejecuta la migración de datos.</p>
        </div>
      )}
    </div>
  );
}
