import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Building2, Info, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic Metadata for SEO and Social Sharing (OpenGraph)
 * Ensures the logo and company name appear when sharing the link.
 */
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });

  if (!tenant) return { title: 'Empresa no encontrada' };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://catagce.renace.tech';
  const logoUrl = tenant.logo ? `${baseUrl}/${tenant.logo}` : `${baseUrl}/favicon.ico`;

  return {
    title: `Solicitud de Empleo — ${tenant.name}`,
    description: `Aplica ahora para trabajar en ${tenant.name}. Formulario de solicitud oficial.`,
    openGraph: {
      title: `${tenant.name} — Solicitud de Empleo`,
      description: `Aplica ahora para trabajar en ${tenant.name}.`,
      images: [logoUrl],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tenant.name} — Solicitud de Empleo`,
      images: [logoUrl],
    },
  };
}

export default async function TenantForm({ params }: Props) {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({ where: { slug } });

  if (!tenant) {
    notFound();
  }

  const primaryColor = tenant.primaryColor || '#1b2055';
  const accentColor = tenant.accentColor || '#2dd17c';

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-8">
      <div className="w-full max-w-3xl">
        {/* Header with Dynamic Logo */}
        <header className="mb-12 text-center">
          <div className="relative inline-block p-1 bg-white shadow-2xl rounded-3xl group">
            <div className="overflow-hidden border-4 border-white rounded-2xl w-52 h-52 bg-slate-50 flex items-center justify-center">
              {tenant.logo ? (
                <img 
                  src={`/${tenant.logo}`} 
                  alt={tenant.name} 
                  className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-300">
                  <Building2 size={64} />
                  <span className="mt-2 text-xs font-bold uppercase tracking-widest">{tenant.name}</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 -right-4 bg-emerald-500 text-white p-3 rounded-2xl shadow-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          
          <h1 className="mt-8 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {tenant.name}
          </h1>
          <p className="mt-2 text-slate-400">Solicitud de Empleo Oficial</p>
        </header>

        {/* Form Container (Mockup for now) */}
        <div className="p-8 glass-card">
           <div className="flex items-center gap-3 mb-8 text-emerald-400">
              <Info size={20} />
              <h2 className="text-lg font-semibold">Instrucciones</h2>
           </div>
           
           <p className="text-sm leading-relaxed text-slate-300 mb-8">
             Por favor, completa todos los campos requeridos con información verídica. 
             Asegúrate de adjuntar tu Curriculum Vitae actualizado y una foto reciente.
           </p>

           <div className="space-y-6">
              {/* Form implementation will continue here */}
              <div className="py-20 text-center border-2 border-dashed border-white/10 rounded-xl">
                 <p className="text-slate-500 italic">Componente de Formulario Dinámico en construcción...</p>
                 <button className="mt-4 px-6 py-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm font-bold border border-emerald-500/20">
                    Siguiente Paso
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
