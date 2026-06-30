import Link from "next/link";
import { ArrowRight, Shield, ClipboardList, Palette } from "lucide-react";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";

export default function Home() {
  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[min(600px,100vw)] h-[min(600px,100vw)] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none animate-tl-float" />

      <header className="relative z-10 flex items-center justify-between max-w-6xl px-4 py-5 mx-auto sm:px-6 sm:py-6">
        <TalentoLinkLogo size="sm" />
        <Link href="/admin/login" className="tl-btn-ghost text-xs px-4 py-2">
          Acceder
        </Link>
      </header>

      <section className="relative z-10 max-w-6xl px-4 pt-8 pb-16 mx-auto text-center sm:px-6 sm:pt-12 sm:pb-20">
        <h1 className="max-w-3xl mx-auto text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl animate-tl-fade-in">
          Recluta personal para{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-indigo-400">
            tu empresa
          </span>
        </h1>
        <p className="max-w-xl mx-auto mt-5 text-base leading-relaxed text-slate-400 sm:text-lg animate-tl-fade-in">
          Formulario de empleo con tu marca, solicitudes organizadas y panel privado
          para revisar candidatos — solo los tuyos.
        </p>

        <div className="flex flex-col items-stretch justify-center gap-3 mt-8 max-w-sm mx-auto sm:max-w-none sm:flex-row sm:items-center animate-tl-fade-in">
          <Link href="/admin/login" className="tl-btn-primary px-8 py-3.5 text-base justify-center">
            Entrar al panel
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <section className="relative z-10 max-w-6xl px-4 pb-20 mx-auto sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3 tl-stagger">
          {[
            {
              icon: Palette,
              title: "Tu marca",
              desc: "Colores, logo y formulario con la imagen de tu negocio.",
            },
            {
              icon: ClipboardList,
              title: "Solicitudes",
              desc: "Cada postulante queda registrado con foto, CV y datos completos.",
            },
            {
              icon: Shield,
              title: "Datos privados",
              desc: "Los candidatos de tu empresa no se comparten con otras organizaciones.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="tl-card-hover p-5 sm:p-6 text-left">
              <div className="flex items-center justify-center w-10 h-10 mb-4 rounded-xl bg-teal-500/10">
                <Icon className="w-5 h-5 text-teal-400" />
              </div>
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
