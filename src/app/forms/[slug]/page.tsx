import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Building2, Sparkles } from "lucide-react";
import Link from "next/link";
import { buildFormSections, type TenantSettings } from "@/lib/form-config";
import { TenantApplicationForm } from "@/components/forms/TenantApplicationForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function TenantForm({ params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || !tenant.active) notFound();

  const primary = tenant.primaryColor || "#1b2055";
  const accent = tenant.accentColor || "#5eead4";
  const bg = tenant.backgroundColor || "#0f172a";
  const settings = (tenant.settings ?? {}) as TenantSettings;
  const sections = buildFormSections(settings);

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh]" style={{ background: bg }}>
      <header
        className="border-b border-white/[0.06] animate-tl-fade-in"
        style={{ background: `linear-gradient(180deg, ${primary}50, transparent)` }}
      >
        <div className="flex items-center justify-between w-full max-w-2xl px-4 py-4 mx-auto sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-3 h-3" style={{ color: accent }} />
            TalentoLink
          </div>
          <Link href="/" className="text-xs text-slate-500 transition-colors hover:text-white">
            forms.renace.tech
          </Link>
        </div>
      </header>

      <main className="flex flex-col items-center flex-1 px-4 py-8 sm:py-12 tl-page-enter">
        <div className="w-full max-w-lg text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-5 rounded-2xl border border-white/10 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${primary}, ${accent}99)` }}
          >
            {tenant.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/${tenant.logo}`} alt="" className="object-contain w-12 h-12 sm:w-16 sm:h-16 rounded-xl" />
            ) : (
              <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            )}
          </div>
          <h1 className="text-xl font-bold text-white sm:text-3xl">{tenant.name}</h1>
          <p className="mt-2 text-sm text-slate-400">Solicitud de empleo</p>
        </div>

        <div className="w-full max-w-lg">
          <TenantApplicationForm
            slug={slug}
            tenantName={tenant.name}
            sections={sections}
            theme={{ primary, accent, bg }}
          />
        </div>

        <p className="mt-8 text-[10px] text-slate-600">
          Powered by TalentoLink · Tus datos están protegidos
        </p>
      </main>
    </div>
  );
}
