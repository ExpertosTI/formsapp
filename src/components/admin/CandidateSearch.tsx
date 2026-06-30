"use client";

import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  initialOrden: string;
  initialAgrupar: string;
  lockEmpresa?: string;
}

export function CandidateSearch({
  tenants,
  initialQuery,
  initialEmpresa,
  initialEstado,
  initialOrden,
  initialAgrupar,
  lockEmpresa,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(initialQuery);
  const [empresa, setEmpresa] = useState(lockEmpresa ?? initialEmpresa);
  const [estado, setEstado] = useState(initialEstado);
  const [orden, setOrden] = useState(initialOrden);
  const [agrupar, setAgrupar] = useState(initialAgrupar);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (empresa) params.set("empresa", empresa);
      if (estado) params.set("estado", estado);
      if (orden) params.set("orden", orden);
      if (agrupar) params.set("agrupar", agrupar);
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 280);
    return () => clearTimeout(t);
  }, [query, empresa, estado, orden, agrupar, router, pathname]);

  return (
    <div className="p-4 sm:p-5 space-y-4 glass-card">
      <div className="relative">
        <Search className="absolute w-4 h-4 -translate-y-1/2 left-4 top-1/2 text-slate-500 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar nombre, cédula, correo, sector…"
          className="w-full py-3 pl-11 pr-4 text-sm tl-input"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {!lockEmpresa && (
          <select value={empresa} onChange={(e) => setEmpresa(e.target.value)} className="w-full px-4 py-2.5 text-sm tl-input">
            <option value="">Todas las empresas</option>
            {tenants.map((t) => (
              <option key={t.slug} value={t.slug}>{t.name}</option>
            ))}
          </select>
        )}

        <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full px-4 py-2.5 text-sm tl-input">
          <option value="">Todos los estados</option>
          <option value="favorito">★ Pendientes / Favoritos</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <select value={orden} onChange={(e) => setOrden(e.target.value)} className="w-full px-4 py-2.5 text-sm tl-input">
          <option value="">Más recientes</option>
          <option value="puntuacion_desc">Mejor puntuación</option>
          <option value="sueldo_desc">Sueldo: mayor a menor</option>
          <option value="sueldo_asc">Sueldo: menor a mayor</option>
          <option value="nombre">Nombre A-Z</option>
        </select>

        <select value={agrupar} onChange={(e) => setAgrupar(e.target.value)} className="w-full px-4 py-2.5 text-sm tl-input">
          <option value="">Lista plana</option>
          <option value="sector">Por sector</option>
          <option value="sueldo">Por sueldo</option>
          <option value="empresa">Por empresa</option>
        </select>
      </div>
    </div>
  );
}
