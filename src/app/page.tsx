import Link from "next/link";
import {
  Smartphone,
  Apple,
  Monitor,
  Laptop,
  Download,
  Sparkles,
  BellRing,
  CheckCircle2,
  ArrowRight,
  Shield,
  Users,
  MessageCircle,
  Calendar,
  Zap,
  Star,
  Layers,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";

export default function Home() {
  return (
    <main className="relative min-h-screen min-h-[100dvh] overflow-hidden text-slate-100 bg-[#070b14]">
      {/* Luces de fondo ambientales */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[min(900px,100vw)] h-[min(600px,100vw)] rounded-full bg-gradient-to-tr from-teal-500/15 to-indigo-600/20 blur-[140px] pointer-events-none animate-tl-float" />
      <div className="absolute top-[800px] -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[1400px] -right-40 w-96 h-96 rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />

      {/* Barra de Navegación */}
      <header className="relative z-20 flex items-center justify-between max-w-7xl px-4 py-5 mx-auto sm:px-6 sm:py-6">
        <TalentoLinkLogo size="md" />

        <div className="flex items-center gap-3">
          <a
            href="#descargas"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-teal-300 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar Apps
          </a>

          <Link href="/admin/login" className="tl-btn-ghost text-xs px-4 py-2">
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-5xl px-4 pt-10 pb-16 mx-auto text-center sm:px-6 sm:pt-16 sm:pb-24">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/25 animate-tl-fade-in shadow-lg shadow-teal-500/5">
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>TalentoLink Manager v2.4 · Multiplataforma Nativa</span>
        </div>

        <h1 className="max-w-4xl mx-auto text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15] animate-tl-fade-in">
          El Manager de Reclutamiento y Talento para{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-cyan-300 to-indigo-400">
            tu empresa
          </span>
        </h1>

        <p className="max-w-2xl mx-auto mt-6 text-base leading-relaxed text-slate-300 sm:text-lg animate-tl-fade-in">
          Gestiona todas tus vacantes, recibe candidatos con <strong>notificaciones push al instante</strong>,
          evalúa con Inteligencia Artificial y envía mensajes por WhatsApp desde cualquier dispositivo.
        </p>

        {/* CTAs de Acceso Rápido */}
        <div className="flex flex-col items-center justify-center gap-3.5 mt-8 sm:flex-row animate-tl-fade-in">
          <a
            href="#descargas"
            className="w-full sm:w-auto tl-btn-primary px-8 py-3.5 text-sm font-bold justify-center"
          >
            <Download className="w-4 h-4" />
            Descargar Manager Nativo
          </a>

          <Link
            href="/admin/login"
            className="w-full sm:w-auto tl-btn-ghost px-6 py-3.5 text-sm font-semibold justify-center"
          >
            Abrir versión Web
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Badges de Plataformas Soportadas */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Android (APK)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
            <Apple className="w-3.5 h-3.5 text-slate-200" /> iOS & iPadOS
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
            <Laptop className="w-3.5 h-3.5 text-blue-400" /> macOS (Apple Silicon / Intel)
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" /> Windows (x64 / ARM)
          </span>
        </div>
      </section>

      {/* MOCKUP INTERACTIVO DEL MANAGER */}
      <section className="relative z-10 max-w-6xl px-4 pb-20 mx-auto sm:px-6">
        <div className="relative p-3 sm:p-4 rounded-3xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/10 shadow-2xl shadow-black/60">
          <div className="rounded-2xl bg-[#090f1d] border border-white/10 overflow-hidden">
            {/* Header del Mockup */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-semibold text-slate-400">
                  TalentoLink Manager — Panel de Control en Vivo
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                WhatsApp Conectado
              </span>
            </div>

            {/* Contenido Visual del Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 sm:p-6">
              {/* Tarjeta de Métricas Rápidas */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Nuevos Postulantes
                  </span>
                  <BellRing className="w-4 h-4 text-teal-400" />
                </div>
                <p className="text-3xl font-extrabold text-white">48</p>
                <p className="text-[11px] text-teal-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" /> +12 hoy con match alto de IA
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Entrevistas del Día
                  </span>
                  <Calendar className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-3xl font-extrabold text-white">7 Citas</p>
                <p className="text-[11px] text-slate-400">Sincronizadas por WhatsApp</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Vacantes Activas
                  </span>
                  <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-3xl font-extrabold text-white">5 Puestos</p>
                <p className="text-[11px] text-slate-400">Formulario 100% personalizable</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE DESCARGAS MULTIPLATAFORMA */}
      <section id="descargas" className="relative z-10 max-w-6xl px-4 py-16 mx-auto sm:px-6">
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Descarga TalentoLink Manager
          </h2>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            Instala la aplicación nativa en tus teléfonos y computadoras para manipular candidatos,
            recibir alertas en tiempo real y gestionar entrevistas donde sea que estés.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* ANDROID */}
          <div className="p-6 tl-card text-left space-y-4 hover:border-emerald-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                APK Directa
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Android</h3>
              <p className="text-xs text-slate-400 mt-1">
                Instalador directo APK para smartphones y tablets Android.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="/admin/login"
                className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-emerald-300 hover:text-white hover:bg-emerald-500/20 border-emerald-500/30"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar APK (Android)
              </a>
            </div>
          </div>

          {/* iOS */}
          <div className="p-6 tl-card text-left space-y-4 hover:border-white/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-white border border-white/20">
                <Apple className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 uppercase">
                iOS / iPad
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Apple iOS</h3>
              <p className="text-xs text-slate-400 mt-1">
                Optimizado para iPhone y iPad con soporte para Notificaciones Push.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="/admin/login"
                className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-slate-200 hover:text-white hover:bg-white/10"
              >
                <Apple className="w-3.5 h-3.5" />
                Instalar en iOS
              </a>
            </div>
          </div>

          {/* MACOS */}
          <div className="p-6 tl-card text-left space-y-4 hover:border-indigo-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Laptop className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
                macOS
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mac App</h3>
              <p className="text-xs text-slate-400 mt-1">
                Binario nativo para Apple Silicon (M1/M2/M3/M4) e Intel.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="/admin/login"
                className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-indigo-300 hover:text-white hover:bg-indigo-500/20 border-indigo-500/30"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar DMG (Mac)
              </a>
            </div>
          </div>

          {/* WINDOWS */}
          <div className="p-6 tl-card text-left space-y-4 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                Windows
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Windows PC</h3>
              <p className="text-xs text-slate-400 mt-1">
                Instalador para Windows 10 y 11 con inicio automático en segundo plano.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="/admin/login"
                className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-cyan-300 hover:text-white hover:bg-cyan-500/20 border-cyan-500/30"
              >
                <Download className="w-3.5 h-3.5" />
                Descargar EXE (Windows)
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CARACTERÍSTICAS CLAVE DEL MANAGER */}
      <section className="relative z-10 max-w-6xl px-4 py-16 mx-auto sm:px-6">
        <div className="max-w-2xl mx-auto mb-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
            Todo lo que tu equipo necesita en una sola app
          </h2>
          <p className="mt-3 text-sm text-slate-400 sm:text-base">
            Diseñada especialmente para departamentos de Recursos Humanos, gerentes y reclutadores.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: BellRing,
              title: "Alertas Inmediatas de Postulaciones",
              desc: "Recibe notificaciones en tiempo real en tu teléfono cada vez que un candidato calificado envíe su solicitud.",
            },
            {
              icon: Sparkles,
              title: "Scoring y Análisis con Inteligencia Artificial",
              desc: "Evaluación automática del perfil, cálculo de compatibilidad para el puesto y resumen instantáneo del currículum.",
            },
            {
              icon: MessageCircle,
              title: "WhatsApp Directo con Escaneo QR",
              desc: "Envía citaciones a entrevistas, aceptaciones y seguimiento utilizando el número de WhatsApp oficial de tu negocio.",
            },
            {
              icon: SlidersHorizontal,
              title: "Editor de Preguntas y Vacantes",
              desc: "Edita las áreas de trabajo (Cajero, Chofer, Vendedor, etc.), activa o desactiva secciones y añade preguntas personalizadas.",
            },
            {
              icon: Calendar,
              title: "Agendador de Entrevistas y Cupos",
              desc: "Programa citas presenciales organizadas con cupos por hora y confirmación automática por mensaje.",
            },
            {
              icon: Shield,
              title: "Aislamiento Total y Privacidad de Datos",
              desc: "Tus postulantes y bases de datos son 100% privados y exclusivos de tu empresa. Cero filtraciones.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 tl-card-hover text-left space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs leading-relaxed text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 py-10 text-xs text-center text-slate-500 border-t border-white/[0.06]">
        <div className="flex flex-col items-center justify-center gap-3">
          <TalentoLinkLogo size="sm" showText={true} />
          <p>© {new Date().getFullYear()} TalentoLink Manager · Desarrollado por RENACE TECH</p>
        </div>
      </footer>
    </main>
  );
}
