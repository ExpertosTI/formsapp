import Link from "next/link";
import {
  Sparkles,
  Building2,
  Brain,
  Shield,
  ArrowRight,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <header className="relative z-10 flex items-center justify-between max-w-6xl px-6 py-6 mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-teal-400 to-indigo-500">
            <Sparkles className="w-4 h-4 text-[var(--tl-bg)]" />
          </div>
          <span className="font-bold text-white">TalentoLink</span>
        </div>
        <Link href="/admin" className="tl-btn-ghost text-xs">
          Admin
        </Link>
      </header>

      <section className="relative z-10 max-w-6xl px-6 pt-12 pb-24 mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-medium rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-200">
          <Zap className="w-3 h-3" />
          IA ligera · 6 empresas · 535 candidatos sincronizados
        </div>

        <h1 className="max-w-4xl mx-auto text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
          Tu talento,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-400">
            conectado
          </span>
        </h1>
        <p className="max-w-2xl mx-auto mt-6 text-lg leading-relaxed text-slate-400">
          Plataforma multi-empresa para formularios de empleo. Resúmenes inteligentes,
          perfiles estilo LinkedIn y gestión centralizada — sin perder un solo dato.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 mt-10 sm:flex-row">
          <Link href="/admin" className="tl-btn-primary px-8 py-3.5 text-base">
            Panel de control
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/admin/candidatos" className="tl-btn-ghost px-8 py-3.5 text-base">
            <Users className="w-4 h-4" />
            Explorar candidatos
          </Link>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl px-6 pb-24 mx-auto">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: Building2,
              title: "Multi-empresa",
              desc: "Cada organización con su marca, colores y formulario propio.",
              color: "text-indigo-400",
            },
            {
              icon: Brain,
              title: "IA no invasiva",
              desc: "Resúmenes automáticos al abrir un perfil. Tú decides, la IA asiste.",
              color: "text-violet-400",
            },
            {
              icon: Shield,
              title: "Datos eternos",
              desc: "Nunca se borran solicitudes. Solo estados y archivo.",
              color: "text-teal-400",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="tl-card-hover p-6 text-left">
              <Icon className={cn("w-8 h-8 mb-4", color)} />
              <h3 className="mb-2 font-bold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 py-8 text-xs tracking-widest text-center uppercase text-slate-600 border-t border-white/[0.04]">
        © {new Date().getFullYear()} TalentoLink · RENACE
      </footer>
    </main>
  );
}
