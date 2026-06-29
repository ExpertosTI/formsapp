import { prisma } from "@/lib/prisma";
import { CandidateCard } from "@/components/admin/CandidateCard";
import { CandidateSearch } from "@/components/admin/CandidateSearch";
import { matchesSearch, asSubmissionData } from "@/lib/candidate";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    q?: string;
    empresa?: string;
    estado?: string;
  }>;
}

export default async function CandidatosPage({ searchParams }: Props) {
  const { q = "", empresa = "", estado = "" } = await searchParams;

  const [submissions, tenants] = await Promise.all([
    prisma.submission.findMany({
      include: { tenant: { select: { name: true, slug: true, primaryColor: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);

  const filtered = submissions.filter((sub) => {
    const data = asSubmissionData(sub.data);
    if (empresa && sub.tenant.slug !== empresa) return false;
    if (estado && sub.status !== estado) return false;
    if (q && !matchesSearch(data, q)) return false;
    return true;
  });

  return (
    <div className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white">Candidatos</h1>
        <p className="mt-1 text-slate-400">
          Explora todos los perfiles como en LinkedIn. {submissions.length} registros en total.
        </p>
      </header>

      <CandidateSearch tenants={tenants} initialQuery={q} initialEmpresa={empresa} initialEstado={estado} />

      <div className="mt-6 space-y-3">
        {filtered.map((sub) => (
          <CandidateCard
            key={sub.id}
            id={sub.id}
            data={sub.data}
            status={sub.status}
            createdAt={sub.createdAt}
            tenantName={sub.tenant.name}
            tenantSlug={sub.tenant.slug}
          />
        ))}
        {filtered.length === 0 && (
          <div className="p-12 text-center glass-card">
            <p className="text-slate-400">No se encontraron candidatos con esos filtros.</p>
          </div>
        )}
      </div>
    </div>
  );
}
