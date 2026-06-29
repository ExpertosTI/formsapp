import { prisma } from "@/lib/prisma";
import { suggestPositions } from "@/lib/ai";
import {
  asSubmissionData,
  parseSalary,
  salaryBucket,
  STATUS_LABELS,
} from "@/lib/candidate";
import { getTenantSession } from "@/lib/tenant-auth";
import { Users, Building2, TrendingUp, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ empresa?: string }>;
}

export default async function EstadisticasPage({ searchParams }: Props) {
  const { empresa: empresaParam } = await searchParams;
  const tenantSession = await getTenantSession();
  const empresaFilter = tenantSession ?? empresaParam ?? "";

  const submissions = await prisma.submission.findMany({
    where: empresaFilter ? { tenant: { slug: empresaFilter } } : undefined,
    include: { tenant: { select: { name: true, slug: true } } },
  });

  const tenants = empresaFilter
    ? []
    : await prisma.tenant.findMany({ select: { name: true, slug: true, _count: { select: { submissions: true } } } });

  const byStatus: Record<string, number> = {};
  const bySalary: Record<string, number> = {};
  const byRole: Record<string, number> = {};
  const salaries: number[] = [];

  for (const sub of submissions) {
    byStatus[sub.status] = (byStatus[sub.status] ?? 0) + 1;
    const data = asSubmissionData(sub.data);
    const bucket = salaryBucket(data.sueldo_aspirado);
    bySalary[bucket] = (bySalary[bucket] ?? 0) + 1;
    const sal = parseSalary(data.sueldo_aspirado);
    if (sal != null) salaries.push(sal);
    for (const role of suggestPositions(data)) {
      byRole[role] = (byRole[role] ?? 0) + 1;
    }
  }

  const avgSalary = salaries.length ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0;
  const maxSalary = salaries.length ? Math.max(...salaries) : 0;

  const Bar = ({ label, count, max }: { label: string; count: number; max: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 truncate pr-2">{label}</span>
        <span className="font-semibold text-white shrink-0">{count}</span>
      </div>
      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-400 to-indigo-400 transition-all duration-500"
          style={{ width: max ? `${Math.max(4, (count / max) * 100)}%` : "0%" }}
        />
      </div>
    </div>
  );

  const maxStatus = Math.max(...Object.values(byStatus), 1);
  const maxSalaryG = Math.max(...Object.values(bySalary), 1);
  const topRoles = Object.entries(byRole).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRole = topRoles[0]?.[1] ?? 1;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="tl-page-header">
        <h1 className="tl-page-title">Estadísticas</h1>
        <p className="tl-page-sub">
          {submissions.length} candidatos
          {empresaFilter ? ` · filtro activo` : " · todas las empresas"}
        </p>
      </header>

      <div className="grid gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-4 tl-stagger">
        {[
          { label: "Total candidatos", value: submissions.length, icon: Users, hue: "text-teal-300" },
          { label: "Empresas", value: empresaFilter ? 1 : tenants.length, icon: Building2, hue: "text-indigo-300" },
          { label: "Sueldo promedio", value: avgSalary ? `RD$${avgSalary.toLocaleString()}` : "—", icon: Wallet, hue: "text-amber-300" },
          { label: "Sueldo máximo", value: maxSalary ? `RD$${maxSalary.toLocaleString()}` : "—", icon: TrendingUp, hue: "text-violet-300" },
        ].map((s) => (
          <div key={s.label} className="p-5 tl-card">
            <s.icon className={`w-5 h-5 mb-3 ${s.hue}`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="p-6 tl-card">
          <h2 className="mb-4 text-xs font-bold tracking-wider uppercase text-teal-400">Por estado</h2>
          <div className="space-y-3">
            {Object.entries(byStatus).map(([k, v]) => (
              <Bar key={k} label={STATUS_LABELS[k] ?? k} count={v} max={maxStatus} />
            ))}
          </div>
        </section>

        <section className="p-6 tl-card">
          <h2 className="mb-4 text-xs font-bold tracking-wider uppercase text-amber-400">Por sueldo aspirado</h2>
          <div className="space-y-3">
            {Object.entries(bySalary).sort().map(([k, v]) => (
              <Bar key={k} label={k} count={v} max={maxSalaryG} />
            ))}
          </div>
        </section>

        <section className="p-6 tl-card lg:col-span-2">
          <h2 className="mb-4 text-xs font-bold tracking-wider uppercase text-violet-400">Puestos sugeridos (IA heurística)</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {topRoles.map(([role, count]) => (
              <Bar key={role} label={role} count={count} max={maxRole} />
            ))}
          </div>
        </section>

        {!empresaFilter && tenants.length > 0 && (
          <section className="p-6 tl-card lg:col-span-2">
            <h2 className="mb-4 text-xs font-bold tracking-wider uppercase text-indigo-400">Por empresa</h2>
            <div className="space-y-3">
              {[...tenants].sort((a, b) => b._count.submissions - a._count.submissions).map((t) => (
                <Bar key={t.slug} label={t.name} count={t._count.submissions} max={tenants[0]?._count.submissions ?? 1} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
