import { prisma } from "@/lib/prisma";
import { dashboardHeuristicInsights } from "@/lib/ai";
import { Users, Building2, Sparkles, TrendingUp, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [tenantCount, submissionCount, newCount, recentSubmissions, tenants] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { status: "nuevo" } }),
      prisma.submission.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { tenant: { select: { name: true, slug: true } } },
      }),
      prisma.tenant.findMany({
        include: { _count: { select: { submissions: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

  const topTenant = [...tenants].sort(
    (a, b) => b._count.submissions - a._count.submissions
  )[0];

  const aiTips = dashboardHeuristicInsights({
    totalCandidates: submissionCount,
    newCount,
    tenantCount,
    topTenant: topTenant?.name,
  });

  const stats = [
    { label: "Empresas", value: tenantCount, icon: Building2, hue: "from-indigo-500/20 to-indigo-500/5 text-indigo-300" },
    { label: "Candidatos", value: submissionCount, icon: Users, hue: "from-teal-500/20 to-teal-500/5 text-teal-300" },
    { label: "Nuevos", value: newCount, icon: Clock, hue: "from-amber-500/20 to-amber-500/5 text-amber-300" },
    {
      label: "Promedio / empresa",
      value: tenantCount ? Math.round(submissionCount / tenantCount) : 0,
      icon: TrendingUp,
      hue: "from-violet-500/20 to-violet-500/5 text-violet-300",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <header className="tl-page-header">
        <h1 className="tl-page-title">Inicio</h1>
        <p className="tl-page-sub">Vista global · datos sincronizados en tiempo real</p>
      </header>

      <div className="tl-card p-5 mb-6 sm:mb-8 border-violet-500/15 bg-gradient-to-r from-violet-500/[0.07] to-teal-500/[0.05]">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 mt-0.5 text-violet-300 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Asistente TalentoLink</p>
            <ul className="mt-2 space-y-1">
              {aiTips.map((tip, i) => (
                <li key={i} className="text-sm text-slate-400">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mb-8 sm:mb-10 sm:grid-cols-2 lg:grid-cols-4 tl-stagger">
        {stats.map((stat) => (
          <div key={stat.label} className={`tl-card-hover p-5 bg-gradient-to-br ${stat.hue.split(" ").slice(0, 2).join(" ")}`}>
            <stat.icon className={`w-5 h-5 mb-3 ${stat.hue.split(" ").pop()}`} />
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Empresas</h2>
            <Link href="/admin/empresas" className="tl-link">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/admin/candidatos?empresa=${tenant.slug}`}
                className="flex items-center justify-between p-4 tl-card-hover"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.accentColor})`,
                    }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{tenant.name}</p>
                    <p className="text-xs text-slate-500">{tenant.slug}</p>
                  </div>
                </div>
                <span className="text-lg font-bold text-teal-400">{tenant._count.submissions}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Recientes</h2>
            <Link href="/admin/candidatos" className="tl-link">
              Ver todos →
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
                  className="flex items-center justify-between p-4 tl-card-hover"
                >
                  <div>
                    <p className="font-medium text-white">{name}</p>
                    <p className="text-xs text-slate-500">{sub.tenant.name}</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {sub.createdAt.toLocaleDateString("es-DO")}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
