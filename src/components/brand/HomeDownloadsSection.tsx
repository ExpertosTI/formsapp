"use client";

import { useState } from "react";
import {
  Smartphone,
  Apple,
  Monitor,
  Laptop,
  Download,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PwaInstallDialog } from "./PwaInstallDialog";

export function HomeDownloadsSection() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"mac" | "windows" | "ios" | "android">("mac");

  function openFor(p: "mac" | "windows" | "ios" | "android") {
    setSelectedPlatform(p);
    setModalOpen(true);
  }

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* ANDROID */}
        <div className="p-6 tl-card text-left space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Smartphone className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase">
                Google Play
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Android</h3>
              <p className="text-xs text-slate-400 mt-1">
                App nativa en Google Play: visor de CVs, cámara, compartir y alertas en el dispositivo.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openFor("android")}
              className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-emerald-300 hover:text-white hover:bg-emerald-500/20 border-emerald-500/30"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar en Android
            </button>
          </div>
        </div>

        {/* iOS */}
        <div className="p-6 tl-card text-left space-y-4 hover:border-white/30 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/10 text-white border border-white/20">
                <Apple className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20 uppercase">
                iOS / iPadOS
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Apple iOS</h3>
              <p className="text-xs text-slate-400 mt-1">
                Optimizado para iPhone y iPad con icono nativo y pantalla completa.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openFor("ios")}
              className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-slate-200 hover:text-white hover:bg-white/10"
            >
              <Apple className="w-3.5 h-3.5" />
              Instalar en iOS
            </button>
          </div>
        </div>

        {/* MACOS */}
        <div className="p-6 tl-card text-left space-y-4 hover:border-indigo-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Laptop className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase">
                macOS App
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Mac (Escritorio)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Aplicación nativa de escritorio en el Dock para Apple Silicon e Intel.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openFor("mac")}
              className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-indigo-300 hover:text-white hover:bg-indigo-500/20 border-indigo-500/30"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar en Mac (Desktop)
            </button>
          </div>
        </div>

        {/* WINDOWS */}
        <div className="p-6 tl-card text-left space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 uppercase">
                Windows PC
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Windows (Escritorio)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Ventana nativa independiente para Windows 10 y 11 con acceso en barra de tareas.
              </p>
            </div>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => openFor("windows")}
              className="w-full tl-btn-ghost text-xs justify-center py-2.5 text-cyan-300 hover:text-white hover:bg-cyan-500/20 border-cyan-500/30"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar en Windows (PC)
            </button>
          </div>
        </div>
      </div>

      <PwaInstallDialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPlatform={selectedPlatform}
      />
    </>
  );
}

export function HeroInstallButton() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="w-full sm:w-auto tl-btn-primary px-8 py-3.5 text-sm font-bold justify-center"
      >
        <Download className="w-4 h-4" />
        Instalar Versión de Escritorio / App
      </button>

      <PwaInstallDialog
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialPlatform="mac"
      />
    </>
  );
}
