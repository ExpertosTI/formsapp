import { prisma } from "@/lib/prisma";
import { Users, Building2, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [tenantCount, submissionCount, recentSubmissions, tenants] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.submission.count(),
      prisma.submission.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { tenant: { select: { name: true, slug: true } } },
      }),
      prisma.tenant.findMany({
        include: { _count: { select: { submissions: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

  const stats = [
    { label: "Empresas activas", value: tenantCount, icon: Building2, color: "text-indigo-400" },
    { label: "Candidatos totales", value: submissionCount, icon: Users, color: "text-emerald-400" },
    {
      label: "Promedio por empresa",
      value: tenantCount ? Math.round(submissionCount / tenantCount) : 0,
      icon: TrendingUp,
      color: "text-amber-400",
    },
    { label: "Solicitudes", value: submissionCount, icon: FileText, color: "text-purple-400" },
  ];

  return (
    <div className="max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white">Panel de Control</h1>
        <p className="mt-1 text-slate-400">
          Vista global de todas las empresas y candidatos. Los datos nunca se eliminan.
        </p>
      </header>

      <div className="grid gap-4 mb-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 glass-card">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-3xl font-black text-white">{stat.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Empresas</h2>
            <Link href="/admin/empresas" className="text-xs font-bold text-emerald-400 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex items-center justify-between p-4 glass-card"
              >
                <div>
                  <p className="font-semibold text-white">{tenant.name}</p>
                  <p className="text-xs text-slate-500">{tenant.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400">
                    {tenant._count.submissions}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">candidatos</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Actividad reciente</h2>
            <Link href="/admin/candidatos" className="text-xs font-bold text-emerald-400 hover:underline">
              Ver candidatos
            </Link>
          </div>
          <div className="space-y-2">
            {recentSubmissions.map((sub) => {
              const data = sub.data as Record<string, unknown>;
              const name = [data.nombre, data.apellido].filter(Boolean).join(" ") || "Sin nombre";
              return (
                <Link
                  key={sub.id}
                  href={`/admin/candidatos/${sub.id}`}
                  className="flex items-center justify-between p-4 transition-colors glass-card hover:bg-white/10"
                >
                  <div>
                    <p className="font-semibold text-white">{name}</p>
                    <p className="text-xs text-slate-500">{sub.tenant.name}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {sub.createdAt.toLocaleDateString("es-DO")}
                  </p>
                </Link>
              );
            })}
            {recentSubmissions.length === 0 && (
              <p className="p-8 text-sm text-center text-slate-500 glass-card">
                No hay candidatos aún. Ejecuta la migración de datos.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
