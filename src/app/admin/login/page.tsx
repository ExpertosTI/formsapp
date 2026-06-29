"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (res.ok) {
      router.push("/admin");
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
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-4 rounded-2xl bg-gradient-to-br from-teal-400 to-indigo-500 shadow-glow">
            <Sparkles className="w-7 h-7 text-[var(--tl-bg)]" />
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">TalentoLink</h1>
          <p className="mt-1 text-sm text-slate-500">forms.renace.tech · Super Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="tl-card p-6 sm:p-8 space-y-5">
          <div>
            <label className="tl-label">Correo</label>
            <input name="email" type="email" required className="tl-input" defaultValue="admin@renace.tech" />
          </div>
          <div>
            <label className="tl-label">Contraseña</label>
            <input name="password" type="password" required className="tl-input" />
          </div>
          {error && (
            <p className="text-sm text-red-400 animate-tl-fade-in" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="tl-btn-primary w-full py-3">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {loading ? "Entrando…" : "Iniciar sesión"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </main>
  );
}
