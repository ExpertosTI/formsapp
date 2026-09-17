"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";
import { ArrowRight, Building2, Loader2, MessageCircle } from "lucide-react";
import { slugify } from "@/lib/slug";

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const slug = useMemo(() => slugify(name), [name]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register-tenant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        whatsapp,
        adminEmail: email,
        adminPassword: password,
        slug,
      }),
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      router.push(`/admin/candidatos?empresa=${data.slug}`);
      router.refresh();
      return;
    }

    setError(data.error || "No se pudo registrar");
    setLoading(false);
  }

  return (
    <main className="flex items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6">
      <div className="absolute w-[min(500px,90vw)] h-[min(500px,90vw)] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />
      <div className="relative w-full max-w-md animate-tl-scale-in">
        <div className="mb-8 text-center flex flex-col items-center">
          <TalentoLinkLogo size="lg" showText={false} className="mb-4 justify-center" />
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Registra tu empresa</h1>
          <p className="mt-1 text-sm text-slate-500">Con WhatsApp, en menos de un minuto</p>
        </div>

        <form onSubmit={handleSubmit} className="tl-card p-6 sm:p-8 space-y-4">
          <p className="flex items-start gap-2 p-3 text-xs rounded-lg bg-teal-500/10 text-teal-200 border border-teal-500/20">
            <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Te enviaremos la bienvenida a tu WhatsApp y podrás entrar al panel al instante.
          </p>

          <div>
            <label className="tl-label">Nombre de la empresa</label>
            <input
              className="tl-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Distribuidora Norte"
            />
            {slug && (
              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                Formulario: /forms/{slug}
              </p>
            )}
          </div>

          <div>
            <label className="tl-label">WhatsApp de la empresa</label>
            <input
              className="tl-input"
              required
              inputMode="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="809-000-0000"
            />
          </div>

          <div>
            <label className="tl-label">Correo del administrador</label>
            <input
              type="email"
              className="tl-input"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tuempresa.com"
            />
          </div>

          <div>
            <label className="tl-label">Contraseña</label>
            <input
              type="password"
              className="tl-input"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="tl-btn-primary w-full py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {loading ? "Creando empresa…" : "Crear empresa"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="text-teal-300 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
