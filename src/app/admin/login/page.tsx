"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Network, Lock } from "lucide-react";

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
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
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
    <main className="flex items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-md p-8 glass-card">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-emerald-500">
            <Network className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">TalentoLink</h1>
          <p className="text-sm text-slate-400">catagce.renace.tech</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Correo
            </label>
            <input
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 text-sm text-white border rounded-xl bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="admin@renace.tech"
            />
          </div>
          <div>
            <label className="block mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              Contraseña
            </label>
            <input
              name="password"
              type="password"
              required
              className="w-full px-4 py-3 text-sm text-white border rounded-xl bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center w-full gap-2 py-3 font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:opacity-90 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </main>
  );
}
