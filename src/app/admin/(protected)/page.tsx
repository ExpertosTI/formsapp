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
      <div className="w-full max-w-7xl mx-auto space-y-8">
        <header className="tl-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="tl-page-title">{tenant.name}</h1>
            <p className="tl-page-sub">Panel de reclutamiento · Gestión privada de vacantes y candidatos</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={`/forms/${tenant.slug}`}
              target="_blank"
              className="tl-btn-primary text-xs py-2 px-4"
            >
              Ver mi formulario público →
            </Link>
            <Link
              href="/admin/mi-empresa"
              className="tl-btn-ghost text-xs py-2 px-4"
            >
              Personalizar marca
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 tl-stagger">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5 tl-card-hover">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="w-5 h-5 text-teal-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {stat.label}
                </span>
              </div>
              <p className="text-3xl font-extrabold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Postulaciones Recientes</h2>
              <p className="text-xs text-slate-400">Últimos candidatos recibidos en tu formulario</p>
            </div>
            <Link href={`/admin/candidatos?empresa=${tenant.slug}`} className="tl-link text-xs">
              Ver todos los candidatos ({tenant._count.submissions}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentSubmissions.map((sub) => {
              const data = asSubmissionData(sub.data);
              const name = getCandidateName(data);
              const area = String(data.area_aplicar ?? "General").trim();
              return (
                <Link
                  key={sub.id}
                  href={`/admin/candidatos/${sub.id}`}
                  className="flex items-center justify-between p-4 tl-card-hover group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-teal-500/15 text-teal-300 font-bold text-sm shrink-0 border border-teal-500/20 group-hover:scale-105 transition-transform">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate text-sm">{name}</p>
                      <p className="text-xs text-slate-400 truncate">{area}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-white/5 text-slate-300 border border-white/10">
                      {sub.status}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {sub.createdAt.toLocaleDateString("es-DO", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </Link>
              );
            })}
            {recentSubmissions.length === 0 && (
              <div className="col-span-full p-10 text-center tl-card space-y-3">
                <UserPlus className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm text-slate-300 font-medium">Aún no has recibido solicitudes</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Comparte el enlace de tu formulario con candidatos para empezar a recibir postulaciones.
                </p>
                <div className="pt-2">
                  <Link href={`/forms/${tenant.slug}`} target="_blank" className="tl-link text-xs">
                    Abrir mi formulario público →
                  </Link>
                </div>
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
    <div className="w-full max-w-7xl mx-auto">
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
