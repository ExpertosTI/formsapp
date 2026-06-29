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
    <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 glass-card">
      <div className="relative">
        <Search className="absolute w-4 h-4 -translate-y-1/2 left-4 top-1/2 text-slate-500 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre, cédula, correo..."
          className="w-full py-3 pl-11 pr-4 text-sm tl-input"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        <select
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          className="w-full px-4 py-2.5 text-sm tl-input"
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
          className="w-full px-4 py-2.5 text-sm tl-input"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button type="submit" className="tl-btn-primary w-full sm:w-auto sm:min-w-[7rem]">
          Buscar
        </button>
      </div>
    </form>
  );
}
