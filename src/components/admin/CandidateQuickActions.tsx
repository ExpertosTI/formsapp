"use client";

import { useState } from "react";
import { Phone, MessageCircle, Send, Check, X, Sparkles } from "lucide-react";
import { normalizeEvoPhone, whatsAppClickUrl } from "@/lib/notifications/phone";

interface Props {
  candidateName: string;
  phone: string;
  tenantName: string;
  appliedRole: string;
  tenantSlug: string;
}

export function CandidateQuickActions({
  candidateName,
  phone,
  tenantName,
  appliedRole,
  tenantSlug,
}: Props) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("entrevista");
  const [customText, setCustomText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const cleanPhone = normalizeEvoPhone(phone) || phone;

  const templates: Record<string, string> = {
    entrevista: `Hola ${candidateName}, te saludamos de ${tenantName}. Hemos revisado tu solicitud para la posición de ${appliedRole} y nos gustaría coordinar una entrevista contigo. ¿Qué día y horario te convendría?`,
    documentos: `Hola ${candidateName}, te saludamos de ${tenantName}. Para avanzar en tu proceso para la posición de ${appliedRole}, por favor envíanos una copia de tu cédula y certificados actualizados.`,
    oferta: `¡Hola ${candidateName}! Desde ${tenantName} nos complace comunicarte que has sido seleccionado/a para el puesto de ${appliedRole}. Nos pondremos en contacto contigo para los detalles de contratación.`,
    banco: `Hola ${candidateName}, gracias por postularte en ${tenantName}. Tu perfil ha quedado registrado en nuestra base de datos prioritaria para futuras vacantes de ${appliedRole}.`,
  };

  const currentMessage = customText || templates[selectedTemplate] || templates.entrevista;

  async function handleSendWhatsApp() {
    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tenantSlug,
          action: "test",
          phone: cleanPhone,
          message: currentMessage,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.sent) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setOpenModal(false);
        }, 1800);
      } else {
        // Fallback abrir link de WhatsApp directo
        const url = whatsAppClickUrl(cleanPhone, currentMessage);
        window.open(url, "_blank");
        setOpenModal(false);
      }
    } catch {
      const url = whatsAppClickUrl(cleanPhone, currentMessage);
      window.open(url, "_blank");
      setOpenModal(false);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <a
          href={`tel:${cleanPhone}`}
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all"
          title={`Llamar a ${candidateName} (${cleanPhone})`}
        >
          <Phone className="w-3.5 h-3.5" />
        </a>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCustomText("");
            setOpenModal(true);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20 transition-all"
          title={`Enviar WhatsApp a ${candidateName}`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-tl-fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setOpenModal(false);
          }}
        >
          <div
            className="w-full max-w-lg p-5 sm:p-6 tl-card space-y-4 animate-tl-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Contactar por WhatsApp</h3>
                  <p className="text-[11px] text-slate-400">{candidateName} · {cleanPhone}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="tl-label">Seleccionar Plantilla Rápida:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "entrevista", label: "📅 Citación a Entrevista" },
                  { id: "documentos", label: "📑 Pedir Documentos" },
                  { id: "oferta", label: "🎉 Oferta de Empleo" },
                  { id: "banco", label: "🤝 Banco de Elegibles" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(t.id);
                      setCustomText("");
                    }}
                    className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all ${
                      selectedTemplate === t.id && !customText
                        ? "border-teal-400 bg-teal-500/15 text-teal-200"
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:border-white/20"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="tl-label">Mensaje a Enviar:</label>
                <textarea
                  rows={4}
                  value={currentMessage}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="tl-input text-xs resize-y"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="tl-btn-ghost text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={sending}
                className="tl-btn-primary text-xs"
              >
                {sending ? (
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                ) : sent ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Enviado
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    Enviar WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
