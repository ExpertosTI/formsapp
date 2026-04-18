import Image from "next/image";
import Link from "next/link";
import { Bolt, Building2, ShieldCheck, Mail, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden">
      <div className="container relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-8 shadow-2xl brand-logo rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-500 animate-pulse">
          <Bolt className="text-white w-10 h-10" />
        </div>

        {/* Brand Name */}
        <h1 className="text-6xl font-black mb-6 tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
          RENACE Forms
        </h1>
        <p className="text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Gestión inteligente de formularios para el ecosistema <span className="text-white font-semibold">RENACE</span>. 
          Seguro, rápido y diseñado para la excelencia.
        </p>

        {/* Features Grid */}
        <div className="grid gap-4 mb-12 sm:grid-cols-3">
          {[
            { icon: <Building2 />, title: "Multi-Empresa", desc: "Gestión centralizada para múltiples organizaciones." },
            { icon: <ShieldCheck />, title: "Seguridad Avanzada", desc: "Arquitectura moderna con aislamiento total de datos." },
            { icon: <Mail />, title: "Notificaciones Pro", desc: "Flujos de correo automatizados y reportes inteligentes." },
          ].map((feature, i) => (
            <div key={i} className="p-6 text-left transition-all duration-300 glass-card hover:bg-white/10 hover:-translate-y-1">
              <div className="flex items-center justify-center w-10 h-10 mb-4 rounded-lg bg-emerald-500/10 text-emerald-400">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-sm font-bold text-white uppercase tracking-wider">{feature.title}</h3>
              <p className="text-xs leading-relaxed text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/forms"
            className="flex items-center gap-2 px-8 py-4 font-bold text-white transition-all rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 group"
          >
            Explorar Formularios
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link
            href="/admin"
            className="px-8 py-4 font-bold text-slate-300 transition-all border bg-white/5 border-white/10 rounded-xl hover:bg-white/10 active:scale-95"
          >
            Panel de Control
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-xs font-medium tracking-widest uppercase opacity-40 text-slate-500">
          © {new Date().getFullYear()} RENACE — Todos los derechos reservados
        </footer>
      </div>
    </main>
  );
}
