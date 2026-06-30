import { prisma } from "@/lib/prisma";
import { CandidateCard } from "@/components/admin/CandidateCard";
import { CandidateSearch } from "@/components/admin/CandidateSearch";
import {
  asSubmissionData,
  getCandidateName,
  matchesSearch,
  parseSalary,
  salaryBucket,
} from "@/lib/candidate";
import { parseScoring, computeCandidateScore } from "@/lib/scoring";
import { getTenantSession } from "@/lib/tenant-auth";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    q?: string;
    empresa?: string;
    estado?: string;
    orden?: string;
    agrupar?: string;
  }>;
}

export default async function CandidatosPage({ searchParams }: Props) {
  const params = await searchParams;
  const tenantSession = await getTenantSession();
  const q = params.q ?? "";
  const empresa = tenantSession ?? params.empresa ?? "";
  const estado = params.estado ?? "";
  const orden = params.orden ?? "";
  const agrupar = params.agrupar ?? "";

  const [submissions, tenants] = await Promise.all([
    prisma.submission.findMany({
      include: { tenant: { select: { name: true, slug: true, primaryColor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  let filtered = submissions.filter((sub) => {
    const data = asSubmissionData(sub.data);
    if (empresa && sub.tenant.slug !== empresa) return false;
    if (estado && sub.status !== estado) return false;
    if (q && !matchesSearch(data, q)) return false;
    return true;
  });

  if (orden === "sueldo_desc") {
    filtered = [...filtered].sort((a, b) => (parseSalary(asSubmissionData(b.data).sueldo_aspirado) ?? 0) - (parseSalary(asSubmissionData(a.data).sueldo_aspirado) ?? 0));
  } else if (orden === "sueldo_asc") {
    filtered = [...filtered].sort((a, b) => (parseSalary(asSubmissionData(a.data).sueldo_aspirado) ?? 0) - (parseSalary(asSubmissionData(b.data).sueldo_aspirado) ?? 0));
  } else if (orden === "nombre") {
    filtered = [...filtered].sort((a, b) => getCandidateName(asSubmissionData(a.data)).localeCompare(getCandidateName(asSubmissionData(b.data))));
  } else if (orden === "puntuacion_desc") {
    filtered = [...filtered].sort((a, b) => {
      const sa = parseScoring(asSubmissionData(a.data)) ?? computeCandidateScore(asSubmissionData(a.data));
      const sb = parseScoring(asSubmissionData(b.data)) ?? computeCandidateScore(asSubmissionData(b.data));
      return sb.overall - sa.overall;
    });
  }

  const groups: { label: string; items: typeof filtered }[] = [];
  if (agrupar === "sueldo") {
    const map = new Map<string, typeof filtered>();
    for (const sub of filtered) {
      const bucket = salaryBucket(asSubmissionData(sub.data).sueldo_aspirado);
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket)!.push(sub);
    }
    for (const [label, items] of map) groups.push({ label, items });
  } else if (agrupar === "sector") {
    const map = new Map<string, typeof filtered>();
    for (const sub of filtered) {
      const d = asSubmissionData(sub.data);
      const label = String(d.sector ?? d.ciudad ?? "Sin sector").trim() || "Sin sector";
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(sub);
    }
    for (const [label, items] of [...map].sort((a, b) => b[1].length - a[1].length)) {
      groups.push({ label, items });
    }
  } else if (agrupar === "empresa") {
    const map = new Map<string, typeof filtered>();
    for (const sub of filtered) {
      const label = sub.tenant.name;
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(sub);
    }
    for (const [label, items] of [...map].sort((a, b) => b[1].length - a[1].length)) groups.push({ label, items });
  }

  const renderList = (list: typeof filtered) =>
    list.map((sub) => (
      <CandidateCard
        key={sub.id}
        id={sub.id}
        data={sub.data}
        files={sub.files}
        status={sub.status}
        createdAt={sub.createdAt}
        tenantName={sub.tenant.name}
        tenantSlug={sub.tenant.slug}
      />
    ));

  return (
    <div className="max-w-5xl mx-auto">
      <header className="tl-page-header">
        <h1 className="tl-page-title">{tenantSession ? "Mis candidatos" : "Candidatos"}</h1>
        <p className="tl-page-sub">
          {filtered.length} de {submissions.length} registros
        </p>
      </header>

      <CandidateSearch
        tenants={tenants}
        initialQuery={q}
        initialEmpresa={empresa}
        initialEstado={estado}
        initialOrden={orden}
        initialAgrupar={agrupar}
        lockEmpresa={tenantSession ?? undefined}
      />

      <div className="mt-6">
        {agrupar && groups.length > 0 ? (
          <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="mb-3 text-xs font-bold tracking-wider uppercase text-slate-500">
                {g.label} <span className="text-slate-600">({g.items.length})</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 tl-stagger">{renderList(g.items)}</div>
            </section>
          ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 tl-stagger">
            {renderList(filtered)}
            {filtered.length === 0 && (
              <div className="p-12 text-center glass-card">
                <p className="text-slate-400">No se encontraron candidatos con esos filtros.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
