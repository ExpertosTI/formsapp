"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Trash2 } from "lucide-react";
import { DELETABLE_STATUSES } from "@/lib/candidate";

interface Slot {
  id: string;
  startsAt: string;
  endsAt: string;
  location: string;
  quota: number;
  booked: number;
  remaining: number;
  notes?: string | null;
}

interface Props {
  submissionId: string;
  currentStatus: string;
  tenantSlug: string;
  candidateName: string;
  slots: Slot[];
}

export function CandidateWorkflowPanel({
  submissionId,
  currentStatus,
  tenantSlug,
  candidateName,
  slots,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const canDelete = DELETABLE_STATUSES.includes(
    currentStatus as (typeof DELETABLE_STATUSES)[number],
  );

  async function acceptAndNotify() {
    setLoading("accept");
    setMessage(null);
    setManualUrl(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "aceptado", notifyWhatsApp: true }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessage(j.error ?? "Error al aceptar");
        return;
      }
      if (j.notification?.sent) {
        setMessage("WhatsApp enviado: solicitud aceptada.");
      } else if (j.notification?.manualUrl) {
        setManualUrl(j.notification.manualUrl);
        setMessage("Estado actualizado. Envía el WhatsApp manualmente:");
      } else {
        setMessage("Candidato marcado como aceptado.");
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function bookInterview() {
    if (!slotId) {
      setMessage("Selecciona un cupo de entrevista");
      return;
    }
    setLoading("book");
    setMessage(null);
    setManualUrl(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/book-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, notifyWhatsApp: true }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessage(j.error ?? "Error al agendar");
        return;
      }
      if (j.notification?.sent) {
        setMessage("Entrevista agendada y WhatsApp enviado.");
      } else if (j.notification?.manualUrl) {
        setManualUrl(j.notification.manualUrl);
        setMessage("Entrevista agendada. Envía la invitación por WhatsApp:");
      } else {
        setMessage("Entrevista agendada correctamente.");
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function deleteCandidate() {
    setLoading("delete");
    setMessage(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMessage(j.error ?? "No se pudo eliminar");
        setLoading(null);
        return;
      }
      router.push("/admin/candidatos");
      router.refresh();
    } catch {
      setLoading(null);
    }
  }

  const availableSlots = slots.filter((s) => s.remaining > 0);

  return (
    <section className="p-4 mb-4 space-y-4 tl-card border-emerald-500/15">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
        Acciones de reclutamiento
      </p>

      <div className="space-y-3">
        <button
          type="button"
          onClick={acceptAndNotify}
          disabled={loading !== null || currentStatus === "aceptado"}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors"
        >
          {loading === "accept" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Aceptar y notificar por WhatsApp
        </button>

        <div className="p-3 rounded-xl border border-white/10 bg-white/[0.03] space-y-3">
          <p className="text-xs font-semibold text-slate-300">Invitar a entrevista presencial</p>
          {availableSlots.length === 0 ? (
            <p className="text-xs text-slate-500">
              No hay cupos disponibles. Crea cupos en{" "}
              <a href="/admin/entrevistas" className="text-teal-400 underline">
                Entrevistas
              </a>
              .
            </p>
          ) : (
            <>
              <select
                value={slotId}
                onChange={(e) => setSlotId(e.target.value)}
                className="w-full px-3 py-2 text-sm text-white rounded-lg bg-white/10 border border-white/15"
              >
                {availableSlots.map((s) => {
                  const d = new Date(s.startsAt);
                  const label = `${d.toLocaleDateString("es-DO")} ${d.toLocaleTimeString("es-DO", { hour: "2-digit", minute: "2-digit" })} · ${s.location} (${s.remaining} cupos)`;
                  return (
                    <option key={s.id} value={s.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={bookInterview}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading === "book" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                Agendar y enviar invitación
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
      )}
      {manualUrl && (
        <a
          href={manualUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-400 hover:underline"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Abrir WhatsApp para {candidateName}
        </a>
      )}

      {canDelete && (
        <div className="pt-3 border-t border-white/10">
          {!deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar candidato confirmado
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-red-300">
                ¿Eliminar a {candidateName}? Se borrarán sus datos y archivos. Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 text-xs rounded-lg border border-white/15 text-slate-400"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={deleteCandidate}
                  disabled={loading === "delete"}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white disabled:opacity-50"
                >
                  {loading === "delete" ? "Eliminando…" : "Sí, eliminar"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
