import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Building2, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TenantForm({ params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) notFound();

  const primary = tenant.primaryColor || "#1b2055";
  const accent = tenant.accentColor || "#5eead4";

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="border-b border-white/[0.06]"
        style={{ background: `linear-gradient(180deg, ${primary}40, transparent)` }}
      >
        <div className="flex items-center justify-between max-w-3xl px-6 py-4 mx-auto w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3 h-3" style={{ color: accent }} />
            TalentoLink
          </div>
          <Link href="/" className="text-xs text-slate-500 hover:text-white">
            forms.renace.tech
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-lg text-center">
          <div
            className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl border border-white/10 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${primary}, ${accent}99)` }}
          >
            {tenant.logo ? (
              <img src={`/${tenant.logo}`} alt="" className="object-contain w-16 h-16 rounded-xl" />
            ) : (
              <Building2 className="w-10 h-10 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{tenant.name}</h1>
          <p className="mt-2 text-slate-400">Solicitud de empleo</p>
        </div>

        <div className="w-full max-w-lg mt-10 tl-card p-8">
          <div className="flex items-center gap-2 mb-4" style={{ color: accent }}>
            <CheckCircle2 className="w-5 h-5" />
            <h2 className="font-semibold text-white">Instrucciones</h2>
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Completa el formulario con información verídica. Adjunta tu CV actualizado y una foto reciente.
          </p>

          <div className="mt-8 p-8 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
            <Clock className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            <p className="text-sm text-slate-500">Formulario dinámico en próxima actualización</p>
            <button
              type="button"
              className="mt-4 px-6 py-2.5 text-sm font-semibold rounded-xl text-[var(--tl-bg)]"
              style={{ background: `linear-gradient(135deg, ${accent}, ${primary})` }}
            >
              Comenzar solicitud
            </button>
          </div>
        </div>

        <p className="mt-8 text-[10px] text-slate-600">
          Powered by TalentoLink · Tus datos están protegidos
        </p>
      </main>
    </div>
  );
}
