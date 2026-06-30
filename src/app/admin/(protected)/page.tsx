import { prisma } from "@/lib/prisma";
import { Users, Clock, UserPlus, FileCheck } from "lucide-react";
import Link from "next/link";
import { getTenantSession } from "@/lib/tenant-auth";
import { asSubmissionData, getCandidateName } from "@/lib/candidate";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const tenantSlug = await getTenantSession();

  if (tenantSlug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { _count: { select: { submissions: true } } },
    });
    if (!tenant) return null;

    const [newCount, recentSubmissions] = await Promise.all([
      prisma.submission.count({ where: { tenantId: tenant.id, status: "nuevo" } }),
      prisma.submission.findMany({
        where: { tenantId: tenant.id },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const stats = [
      { label: "Mis candidatos", value: tenant._count.submissions, icon: Users },
      { label: "Nuevos", value: newCount, icon: Clock },
      { label: "Revisados", value: tenant._count.submissions - newCount, icon: FileCheck },
    ];

    return (
      <div className="max-w-2xl mx-auto">
        <header className="tl-page-header">
          <h1 className="tl-page-title">{tenant.name}</h1>
          <p className="tl-page-sub">Panel de reclutamiento · datos privados de tu empresa</p>
        </header>

        <div className="p-4 mb-6 tl-card border-teal-500/15 bg-teal-500/[0.04]">
          <p className="text-sm text-slate-300">
            Solo ves las solicitudes enviadas a tu formulario. Nadie más tiene acceso a estos perfiles.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8 tl-stagger">
          {stats.map((stat) => (
            <div key={stat.label} className="p-4 text-center tl-card">
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-teal-400" />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white">Recientes</h2>
            <Link href={`/admin/candidatos?empresa=${tenant.slug}`} className="tl-link">
              Ver todos →
            </Link>
          </div>
          <div className="space-y-2">
            {recentSubmissions.map((sub) => {
              const data = asSubmissionData(sub.data);
              const name = getCandidateName(data);
              return (
                <Link
                  key={sub.id}
                  href={`/admin/candidatos/${sub.id}`}
                  className="flex items-center justify-between p-4 tl-card-hover"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-500/15 text-sm font-bold text-teal-300 shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{name}</p>
                      <p className="text-xs text-slate-500 capitalize">{sub.status}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-600 shrink-0 ml-2">
                    {sub.createdAt.toLocaleDateString("es-DO", { day: "numeric", month: "short" })}
                  </p>
                </Link>
              );
            })}
            {recentSubmissions.length === 0 && (
              <div className="p-8 text-center tl-card">
                <UserPlus className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-sm text-slate-400">Aún no hay solicitudes</p>
                <Link href={`/forms/${tenant.slug}`} className="inline-block mt-3 tl-link">
                  Ver mi formulario →
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  const [tenantCount, submissionCount, newCount, recentSubmissions, tenants] = await Promise.all([
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

  const stats = [
    { label: "Empresas", value: tenantCount, icon: Users },
    { label: "Candidatos", value: submissionCount, icon: Users },
    { label: "Nuevos", value: newCount, icon: Clock },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <header className="tl-page-header">
        <h1 className="tl-page-title">Super Admin</h1>
        <p className="tl-page-sub">Vista global · uso interno</p>
        <Link href="/admin/empresas" className="inline-flex mt-3 tl-link">
          + Registrar nueva empresa →
        </Link>
      </header>

      <div className="grid gap-4 mb-8 sm:grid-cols-3 tl-stagger">
        {stats.map((stat) => (
          <div key={stat.label} className="p-5 tl-card-hover">
            <stat.icon className="w-5 h-5 mb-3 text-teal-400" />
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
            <Link href="/admin/empresas" className="tl-link">Ver todas →</Link>
          </div>
          <div className="space-y-2">
            {tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/admin/candidatos?empresa=${tenant.slug}`}
                className="flex items-center justify-between p-4 tl-card-hover"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex items-center justify-center w-10 h-10 text-sm font-bold text-white rounded-xl shrink-0"
                    style={{ background: `linear-gradient(135deg, ${tenant.primaryColor}, ${tenant.accentColor})` }}
                  >
                    {tenant.name.charAt(0)}
                  </div>
                  <p className="font-medium text-white truncate">{tenant.name}</p>
                </div>
                <span className="text-lg font-bold text-teal-400 shrink-0 ml-2">{tenant._count.submissions}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white">Recientes</h2>
            <Link href="/admin/candidatos" className="tl-link">Ver todos →</Link>
          </div>
          <div className="space-y-2">
            {recentSubmissions.map((sub) => {
              const data = asSubmissionData(sub.data);
              const name = getCandidateName(data);
              return (
                <Link
                  key={sub.id}
                  href={`/admin/candidatos/${sub.id}`}
                  className="flex items-center justify-between p-4 tl-card-hover"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-slate-500 truncate">{sub.tenant.name}</p>
                  </div>
                  <p className="text-xs text-slate-500 shrink-0 ml-2">
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
