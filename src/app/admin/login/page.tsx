"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";
import { Lock, ArrowRight, Loader2, Building2 } from "lucide-react";

type Mode = "super" | "empresa";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("super");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const endpoint = mode === "super" ? "/api/auth/login" : "/api/auth/tenant-login";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (mode === "empresa" && data.slug) {
        router.push(`/admin/candidatos?empresa=${data.slug}`);
      } else {
        router.push("/admin");
      }
      router.refresh();
    } else {
      setError("Credenciales incorrectas");
      setLoading(false);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6">
      <div className="absolute w-[min(500px,90vw)] h-[min(500px,90vw)] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none animate-tl-float" />
      <div className="relative w-full max-w-md animate-tl-scale-in">
        <div className="mb-8 text-center flex flex-col items-center">
          <TalentoLinkLogo size="lg" showText={false} className="mb-4 justify-center" />
          <h1 className="text-2xl font-bold text-white sm:text-3xl">TalentoLink</h1>
          <p className="mt-1 text-sm text-slate-500">forms.renace.tech</p>
        </div>

        <div className="flex p-1 mb-4 rounded-xl bg-white/[0.04] border border-white/10">
          <button
            type="button"
            onClick={() => { setMode("super"); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mode === "super" ? "bg-white/10 text-white" : "text-slate-500"}`}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => { setMode("empresa"); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mode === "empresa" ? "bg-white/10 text-white" : "text-slate-500"}`}
          >
            Mi empresa
          </button>
        </div>

        <form onSubmit={handleSubmit} className="tl-card p-6 sm:p-8 space-y-5">
          {mode === "empresa" && (
            <p className="flex items-start gap-2 p-3 text-xs rounded-lg bg-teal-500/10 text-teal-200 border border-teal-500/20">
              <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
              Usa el correo y contraseña de administrador de tu empresa (los mismos del sistema anterior).
            </p>
          )}
          <div>
            <label className="tl-label">Correo</label>
            <input name="email" type="email" required className="tl-input" defaultValue={mode === "super" ? "admin@renace.tech" : ""} key={mode} />
          </div>
          <div>
            <label className="tl-label">Contraseña</label>
            <input name="password" type="password" required className="tl-input" />
          </div>
          {error && <p className="text-sm text-red-400 animate-tl-fade-in" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="tl-btn-primary w-full py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? "Entrando…" : "Iniciar sesión"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </main>
  );
}
