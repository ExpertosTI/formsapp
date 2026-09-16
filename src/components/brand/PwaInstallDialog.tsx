"use client";

import { useState, useEffect } from "react";
import {
  Laptop,
  Monitor,
  Smartphone,
  Apple,
  Download,
  X,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Share,
  PlusSquare,
} from "lucide-react";
import Link from "next/link";
import { TalentoLinkLogo } from "./TalentoLinkLogo";

type Platform = "mac" | "windows" | "ios" | "android";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaInstallDialog({
  isOpen,
  onClose,
  initialPlatform = "mac",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialPlatform?: Platform;
}) {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detectar si ya está en modo standalone (instalada)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Detectar plataforma del usuario automáticamente
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform("ios");
    } else if (/android/.test(ua)) {
      setPlatform("android");
    } else if (/win/.test(ua)) {
      setPlatform("windows");
    } else if (/mac/.test(ua)) {
      setPlatform("mac");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleNativeInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("Install prompt error:", err);
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-tl-fade-in">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/15 bg-[#090f1e] shadow-2xl shadow-black/80 animate-tl-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Encabezado */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <TalentoLinkLogo size="sm" showText={false} />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Instalar TalentoLink Manager
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  Escritorio & Móvil
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Experiencia nativa con inicio instantáneo y notificaciones en tiempo real
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de plataforma */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-4 p-1 gap-1 rounded-2xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => setPlatform("mac")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                platform === "mac"
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span className="hidden sm:inline">macOS</span>
              <span className="sm:hidden">Mac</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform("windows")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                platform === "windows"
                  ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Windows</span>
              <span className="sm:hidden">PC</span>
            </button>

            <button
              type="button"
              onClick={() => setPlatform("android")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                platform === "android"
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Android
            </button>

            <button
              type="button"
              onClick={() => setPlatform("ios")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                platform === "ios"
                  ? "bg-white text-slate-950 shadow-lg shadow-white/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Apple className="w-4 h-4" />
              iOS / iPad
            </button>
          </div>

          {/* Botón de 1-Click Install si está soportado por el navegador */}
          {deferredPrompt && !isInstalled && (
            <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-teal-300">¡Tu navegador soporta instalación directa en 1 clic!</p>
                <p className="text-[11px] text-slate-300">
                  Instala TalentoLink en tu computadora como aplicación nativa de escritorio independiente.
                </p>
              </div>
              <button
                type="button"
                disabled={installing}
                onClick={handleNativeInstall}
                className="tl-btn-primary text-xs py-2.5 px-4 whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                {installing ? "Instalando..." : "Instalar ahora"}
              </button>
            </div>
          )}

          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">¡TalentoLink ya está instalado en este dispositivo!</p>
                <p className="text-[11px] text-slate-300">
                  Puedes abrirlo directamente desde tu Dock, Menú Inicio o lista de aplicaciones.
                </p>
              </div>
            </div>
          )}

          {/* Guía visual paso a paso según la plataforma */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            {platform === "mac" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  <span>Instalación en Mac (macOS Sequoia / Sonoma / Ventura)</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <p>
                      <strong>En Safari:</strong> Ve al menú superior <strong>Archivo</strong> ➔ selecciona{" "}
                      <span className="text-white font-semibold">“Agregar al Dock”</span>. Aparecerá TalentoLink como aplicación nativa de Mac con su icono propio.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <p>
                      <strong>En Chrome o Edge:</strong> Haz clic en el icono de instalación{" "}
                      <span className="inline-block px-1.5 py-0.5 rounded bg-white/10 font-mono text-teal-300">⊕</span> a la derecha de la barra de direcciones y pulsa <strong>“Instalar”</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {platform === "windows" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  <span>Instalación en Windows (Windows 11 / Windows 10)</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <p>
                      Abre este sitio en <strong>Microsoft Edge</strong> o <strong>Google Chrome</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <p>
                      Haz clic en el icono de <strong>Aplicación disponible (Instalar app)</strong> en la barra de direcciones o en el menú de tres puntos (⋯) ➔ <strong>Aplicaciones</strong> ➔ <strong>“Instalar este sitio como una aplicación”</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {platform === "android" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Instalación en Android (Chrome, Samsung Internet o Edge)</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <p>
                      Toca el menú de tres puntos <span className="font-bold text-white">(⋮)</span> en la esquina superior derecha del navegador.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <p>
                      Selecciona <span className="text-white font-semibold">“Instalar aplicación”</span> o <strong>“Agregar a la pantalla principal”</strong>. Se añadirá el acceso directo con soporte offline.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {platform === "ios" && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Apple className="w-4 h-4 text-white" />
                  <span>Instalación en iPhone & iPad (Safari)</span>
                </div>
                <div className="space-y-2 text-slate-300">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-bold text-[11px] shrink-0">
                      1
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      En Safari, pulsa el botón <strong>Compartir</strong>{" "}
                      <span className="inline-flex items-center justify-center p-1 rounded bg-white/10 text-white">
                        <Share className="w-3.5 h-3.5" />
                      </span>{" "}
                      en la barra inferior.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03]">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white font-bold text-[11px] shrink-0">
                      2
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      Baja en el menú y selecciona{" "}
                      <span className="text-white font-semibold flex items-center gap-1">
                        <PlusSquare className="w-3.5 h-3.5" /> “Agregar al inicio”
                      </span>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 bg-white/[0.01]">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>PWA Oficial · Sin descargas pesadas ni certificados de terceros</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              onClick={onClose}
              className="tl-btn-ghost text-xs px-4 py-2"
            >
              Abrir versión web
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
