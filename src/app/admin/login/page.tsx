"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TalentoLinkLogo } from "@/components/brand/TalentoLinkLogo";
import { ArrowRight, Building2, Loader2, Lock, MessageCircle } from "lucide-react";
import {
  OWNER_UNLOCK_EMAIL,
  OPS_STORAGE_KEY,
  isNativeApp,
  isOwnerEmail,
} from "@/lib/owner-access";

type Mode = "empresa" | "super";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.8-4.1 2.8-7 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.6 0 4.8-.9 6.4-2.3l-3.1-2.4c-.9.6-2 .9-3.3.9-2.5 0-4.6-1.7-5.4-4l-3.2 2.5C5.1 19.8 8.3 22 12 22z"
      />
      <path
        fill="#4A90E2"
        d="M6.6 14.2c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.4 7.9C2.7 9.2 2.3 10.6 2.3 12.3s.4 3.1 1.1 4.4l3.2-2.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.8c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.8 14.6 2 12 2 8.3 2 5.1 4.2 3.4 7.9l3.2 2.5C7.4 7.5 9.5 5.8 12 5.8z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.4 12.7c0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.5-1.6-3-1.7-1.3-.1-2.5.8-3.1.8-.6 0-1.6-.7-2.7-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.3.7 1 1.5 2.1 2.6 2 .9-.2 1.3-.7 2.4-.7s1.4.5 2.4.7c1.1-.1 1.9-1 2.6-2 .8-1.1 1.1-2.2 1.1-2.3 0 0-2.1-.8-2.1-3.3zM14.5 5.5c.6-.7 1-1.7.9-2.7-.9.1-1.9.6-2.5 1.3-.6.6-1.1 1.6-.9 2.5 1 .1 1.9-.4 2.5-1.1z" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("empresa");
  const [opsUnlocked, setOpsUnlocked] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthMsg, setOauthMsg] = useState("");
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isNativeApp());
    const fromQuery = searchParams.get("ops") === "1";
    const fromStorage = localStorage.getItem(OPS_STORAGE_KEY) === "1";
    if (!isNativeApp() && (fromQuery || fromStorage)) {
      setOpsUnlocked(true);
      if (fromQuery) localStorage.setItem(OPS_STORAGE_KEY, "1");
    }
    const oauth = searchParams.get("oauth");
    if (oauth === "google_pending" || oauth === "apple_pending") {
      setOauthMsg("Google/Apple se activa al configurar las claves OAuth en el servidor. Mientras tanto usa correo o registro con WhatsApp.");
    } else if (oauth && oauth !== "cancelled") {
      setOauthMsg("No se pudo completar el acceso social. Prueba con correo o WhatsApp.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isNativeApp()) return;
    if (isOwnerEmail(email)) {
      setOpsUnlocked(true);
      setMode("super");
    } else {
      setOpsUnlocked(false);
      setMode("empresa");
    }
  }, [email]);

  function handleLogoTap() {
    if (isNativeApp()) return;
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 7) {
      localStorage.setItem(OPS_STORAGE_KEY, "1");
      setOpsUnlocked(true);
      setMode("super");
      setEmail(OWNER_UNLOCK_EMAIL);
      setLogoTaps(0);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const mail = String(form.get("email") || email).trim().toLowerCase();
    const password = String(form.get("password"));

    const useSuper = mode === "super" && opsUnlocked && (!isNativeApp() || isOwnerEmail(mail));
    const endpoint = useSuper ? "/api/auth/login" : "/api/auth/tenant-login";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: mail, password }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (!useSuper && data.slug) {
        router.push(`/admin/candidatos?empresa=${data.slug}`);
      } else {
        router.push("/admin");
      }
      router.refresh();
    } else {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
    }
  }

  function startOAuth(provider: "google" | "apple") {
    setOauthMsg("");
    window.location.href = `/api/auth/oauth/${provider}/start?returnTo=/admin`;
  }

  return (
    <main className="flex items-center justify-center min-h-screen min-h-[100dvh] p-4 sm:p-6">
      <div className="absolute w-[min(500px,90vw)] h-[min(500px,90vw)] rounded-full bg-teal-500/10 blur-[100px] pointer-events-none" />
      <div className="relative w-full max-w-md animate-tl-scale-in">
        <button
          type="button"
          onClick={handleLogoTap}
          className="mb-8 text-center flex flex-col items-center w-full"
          aria-label="TalentoLink"
        >
          <TalentoLinkLogo size="lg" showText={false} className="mb-4 justify-center" />
          <h1 className="text-2xl font-bold text-white sm:text-3xl">TalentoLink</h1>
          <p className="mt-1 text-sm text-slate-500">Tu empresa, tus candidatos</p>
        </button>

        {opsUnlocked && (
          <div className="flex p-1 mb-4 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode("empresa");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "empresa" ? "bg-white/10 text-white" : "text-slate-500"
              }`}
            >
              Mi empresa
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("super");
                setError("");
                setEmail(OWNER_UNLOCK_EMAIL);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === "super" ? "bg-white/10 text-white" : "text-slate-500"
              }`}
            >
              Operador
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="tl-card p-6 sm:p-8 space-y-5">
          <p className="flex items-start gap-2 p-3 text-xs rounded-lg bg-teal-500/10 text-teal-200 border border-teal-500/20">
            <Building2 className="w-4 h-4 shrink-0 mt-0.5" />
            {mode === "super"
              ? "Acceso operador (solo tu cuenta)."
              : "Entra con el correo de administrador de tu empresa."}
          </p>

          <div>
            <label className="tl-label">Correo</label>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="tl-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
            />
          </div>
          <div>
            <label className="tl-label">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="tl-input"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 animate-tl-fade-in" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="tl-btn-primary w-full py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? "Entrando…" : "Entrar a mi empresa"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          {mode === "empresa" && (
            <>
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-[11px]">
                  <span className="px-2 bg-[#0f172a] text-slate-500">acceso rápido</span>
                </div>
              </div>

              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => startOAuth("google")}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition"
                >
                  <GoogleIcon className="w-5 h-5" />
                  Continuar con Google
                </button>
                <button
                  type="button"
                  onClick={() => startOAuth("apple")}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/15 bg-black text-white text-sm font-semibold hover:bg-zinc-900 transition"
                >
                  <AppleIcon className="w-5 h-5" />
                  Continuar con Apple
                </button>
              </div>
              {oauthMsg && <p className="text-xs text-amber-300">{oauthMsg}</p>}
            </>
          )}
        </form>

        <div className="mt-5 space-y-3 text-center">
          <Link
            href="/admin/registro"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-teal-500/30 bg-teal-500/10 text-teal-200 text-sm font-semibold hover:bg-teal-500/15 transition"
          >
            <MessageCircle className="w-4 h-4" />
            Registrar mi empresa con WhatsApp
          </Link>
          <p className="text-[11px] text-slate-600">{native ? "App TalentoLink" : "forms.renace.tech"}</p>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex items-center justify-center min-h-screen text-slate-400 text-sm">
          Cargando…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
