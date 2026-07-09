"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, Loader2, Trash2 } from "lucide-react";

interface Props {
  tenantSlug?: string;
  empresaOptions?: { slug: string; name: string }[];
}

export function InterviewSlotForm({ tenantSlug, empresaOptions = [] }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState(tenantSlug ?? empresaOptions[0]?.slug ?? "");
  const [date, setDate] = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd] = useState("10:00");
  const [location, setLocation] = useState("");
  const [quota, setQuota] = useState(5);
  const [notes, setNotes] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const startsAt = new Date(`${date}T${timeStart}:00`);
    const endsAt = new Date(`${date}T${timeEnd}:00`);

    const res = await fetch(
      `/api/interview-slots${tenantSlug ? "" : `?empresa=${empresa}`}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          location,
          quota,
          notes,
          empresa: tenantSlug ? undefined : empresa,
        }),
      },
    );

    const j = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(j.error ?? "Error al crear cupo");
      return;
    }

    setDate("");
    setLocation("");
    setNotes("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 space-y-4 tl-card">
      <p className="flex items-center gap-2 text-sm font-bold text-white">
        <CalendarPlus className="w-4 h-4 text-teal-400" />
        Nuevo cupo de entrevista
      </p>

      {!tenantSlug && empresaOptions.length > 0 && (
        <div>
          <label className="tl-label">Empresa</label>
          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="tl-input"
            required
          >
            {empresaOptions.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="tl-label">Fecha *</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="tl-input" required />
        </div>
        <div>
          <label className="tl-label">Cupo máximo *</label>
          <input
            type="number"
            min={1}
            max={100}
            value={quota}
            onChange={(e) => setQuota(Number(e.target.value))}
            className="tl-input"
            required
          />
        </div>
        <div>
          <label className="tl-label">Hora inicio *</label>
          <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="tl-input" required />
        </div>
        <div>
          <label className="tl-label">Hora fin *</label>
          <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="tl-input" required />
        </div>
      </div>

      <div>
        <label className="tl-label">Lugar de la entrevista *</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ej. Oficina principal, Av. …"
          className="tl-input"
          required
        />
      </div>

      <div>
        <label className="tl-label">Notas (opcional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Traer cédula, vestimenta, etc."
          className="tl-input"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button type="submit" disabled={loading} className="tl-btn-primary w-full sm:w-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Crear cupo"}
      </button>
    </form>
  );
}

interface SlotRow {
  id: string;
  startsAt: Date;
  endsAt: Date;
  location: string;
  quota: number;
  booked: number;
  remaining: number;
  notes?: string | null;
}

export function InterviewSlotList({ slots }: { slots: SlotRow[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  async function remove(id: string) {
    setDeleting(id);
    const res = await fetch(`/api/interview-slots/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (res.ok) router.refresh();
  }

  if (!slots.length) {
    return (
      <div className="p-8 text-center tl-card">
        <p className="text-sm text-slate-400">No hay cupos programados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {slots.map((s) => {
        const d = new Date(s.startsAt);
        return (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4 tl-card">
            <div className="min-w-0">
              <p className="font-medium text-white">
                {d.toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short" })}{" "}
                · {d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-sm text-slate-400 truncate">{s.location}</p>
              <p className="mt-1 text-xs text-slate-500">
                {s.booked}/{s.quota} cupos usados · {s.remaining} disponibles
              </p>
            </div>
            {s.booked === 0 && (
              <button
                type="button"
                onClick={() => remove(s.id)}
                disabled={deleting === s.id}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10"
              >
                {deleting === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Eliminar
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
