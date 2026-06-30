"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Link2, Copy, Check } from "lucide-react";
import { slugify } from "@/lib/slug";

export function CreateTenantForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdUrl, setCreatedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCreatedUrl("");

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        slug: fd.get("slug"),
        adminEmail: fd.get("adminEmail"),
        adminPassword: fd.get("adminPassword"),
        primaryColor: fd.get("primaryColor"),
        accentColor: fd.get("accentColor"),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setCreatedUrl(`https://forms.renace.tech${data.formUrl}`);
      router.refresh();
    } else {
      setError(data.error ?? "No se pudo crear");
    }
    setLoading(false);
  }

  function onNameInput(e: React.ChangeEvent<HTMLInputElement>) {
    const slugInput = document.getElementById("tenant-slug") as HTMLInputElement | null;
    if (slugInput && !slugInput.dataset.touched) {
      slugInput.value = slugify(e.target.value);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-full gap-2 p-4 mb-6 text-sm font-semibold border border-dashed rounded-2xl border-teal-500/30 text-teal-300 bg-teal-500/5 hover:bg-teal-500/10 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Registrar nueva empresa
      </button>
    );
  }

  return (
    <div className="p-5 mb-6 tl-card border-teal-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-5 h-5 text-teal-400" />
        <h2 className="font-semibold text-white">Nueva empresa</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="tl-label">Nombre comercial *</label>
            <input name="name" required onInput={onNameInput} className="tl-input" placeholder="Mi Boutique SRL" />
          </div>
          <div>
            <label className="tl-label">URL corta (slug) *</label>
            <input
              id="tenant-slug"
              name="slug"
              required
              className="tl-input font-mono text-xs"
              placeholder="mi-boutique"
              onChange={(e) => { e.currentTarget.dataset.touched = "1"; }}
            />
            <p className="mt-1 text-[10px] text-slate-500">forms.renace.tech/forms/<span className="text-teal-400">slug</span></p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="tl-label">Correo administrador *</label>
            <input name="adminEmail" type="email" required className="tl-input" placeholder="admin@empresa.com" />
          </div>
          <div>
            <label className="tl-label">Contraseña inicial *</label>
            <input name="adminPassword" type="password" required minLength={8} className="tl-input" placeholder="Mínimo 8 caracteres" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="tl-label">Color principal</label>
            <input name="primaryColor" type="color" defaultValue="#1b2055" className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
          </div>
          <div>
            <label className="tl-label">Color acento</label>
            <input name="accentColor" type="color" defaultValue="#2dd4bf" className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {createdUrl && (
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-teal-300 mb-2">
              <Link2 className="w-3.5 h-3.5" />
              Empresa creada
            </p>
            <p className="text-xs text-slate-400 break-all">{createdUrl}</p>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(createdUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="inline-flex items-center gap-1 mt-2 text-xs text-teal-400"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copiado" : "Copiar enlace del formulario"}
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" onClick={() => setOpen(false)} className="tl-btn-ghost flex-1">
            Cerrar
          </button>
          <button type="submit" disabled={loading} className="tl-btn-primary flex-1">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear empresa"}
          </button>
        </div>
      </form>
    </div>
  );
}
