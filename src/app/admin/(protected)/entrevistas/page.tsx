import { prisma } from "@/lib/prisma";
import { getTenantSession } from "@/lib/tenant-auth";
import { InterviewSlotForm, InterviewSlotList } from "@/components/admin/InterviewSlotManager";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ empresa?: string }>;
}

export default async function EntrevistasPage({ searchParams }: Props) {
  const params = await searchParams;
  const tenantSession = await getTenantSession();

  const tenants = tenantSession
    ? []
    : await prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } });

  const slug = tenantSession ?? params.empresa ?? tenants[0]?.slug;
  const tenant = slug
    ? await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true, slug: true } })
    : null;

  const slots = tenant
    ? await prisma.interviewSlot.findMany({
        where: { tenantId: tenant.id, startsAt: { gte: new Date(Date.now() - 86400000) } },
        orderBy: { startsAt: "asc" },
        include: { _count: { select: { bookings: true } } },
      })
    : [];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <header className="tl-page-header">
        <h1 className="tl-page-title">Entrevistas</h1>
        <p className="tl-page-sub">
          {tenant
            ? `Cupos presenciales para ${tenant.name}`
            : "Selecciona una empresa para gestionar cupos"}
        </p>
      </header>

      {tenant ? (
        <>
          <InterviewSlotForm tenantSlug={tenant.slug} empresaOptions={tenants} />
          <section>
            <h2 className="mb-3 text-sm font-bold text-white">Cupos programados</h2>
            <InterviewSlotList
              slots={slots.map((s) => ({
                id: s.id,
                startsAt: s.startsAt,
                endsAt: s.endsAt,
                location: s.location,
                quota: s.quota,
                booked: s._count.bookings,
                remaining: Math.max(0, s.quota - s._count.bookings),
                notes: s.notes,
              }))}
            />
          </section>
        </>
      ) : (
        <div className="p-8 text-center tl-card">
          <p className="text-slate-400">Registra una empresa primero.</p>
        </div>
      )}

      {!tenantSession && tenants.length > 1 && tenant && (
        <p className="text-xs text-slate-500">
          Cambia de empresa desde la URL: ?empresa=slug
        </p>
      )}
    </div>
  );
}
