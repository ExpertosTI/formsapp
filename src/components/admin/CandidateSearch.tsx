"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { FormEvent, useState } from "react";
import { STATUS_LABELS } from "@/lib/candidate";

interface Tenant {
  slug: string;
  name: string;
}

interface Props {
  tenants: Tenant[];
  initialQuery: string;
  initialEmpresa: string;
  initialEstado: string;
}

export function CandidateSearch({
  tenants,
  initialQuery,
  initialEmpresa,
  initialEstado,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [empresa, setEmpresa] = useState(initialEmpresa);
  const [estado, setEstado] = useState(initialEstado);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (empresa) params.set("empresa", empresa);
    if (estado) params.set("estado", estado);
    router.push(`/admin/candidatos?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 glass-card">
      <div className="relative">
        <Search className="absolute w-4 h-4 -translate-y-1/2 left-4 top-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, cédula, correo, experiencia..."
          className="w-full py-3 pl-11 pr-4 text-sm text-white border rounded-xl bg-white/5 border-white/10 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          className="px-4 py-2 text-sm text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="">Todas las empresas</option>
          {tenants.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="px-4 py-2 text-sm text-white border rounded-lg bg-white/5 border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="px-5 py-2 text-sm font-bold text-white rounded-lg bg-emerald-600 hover:bg-emerald-500"
        >
          Buscar
        </button>
      </div>
    </form>
  );
}
