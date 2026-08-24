"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Unlink,
  Send,
  Smartphone,
  Info,
  Loader2,
  ShieldCheck,
  Activity,
} from "lucide-react";

interface Props {
  tenantSlug: string;
  initialPhone?: string;
  initialNotifyOnSubmission?: boolean;
  onAlertsChange?: (notify: boolean, phone: string) => void;
}

interface DiagInfo {
  ok: boolean;
  configured: boolean;
  apiHost?: string;
  keyLen?: number;
  source?: string;
  probeStatus?: number;
  probeOk?: boolean;
  createStatus?: number;
  canCreate?: boolean;
  instanceCount?: number | null;
  hint?: string;
  detail?: string;
  message?: string;
}

export function WhatsAppQrCard({
  tenantSlug,
  initialPhone = "",
  initialNotifyOnSubmission = false,
  onAlertsChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<string>("unknown");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [tip, setTip] = useState<string>("");
  const [adminPhone, setAdminPhone] = useState(initialPhone);
  const [notifyOnSubmission, setNotifyOnSubmission] = useState(initialNotifyOnSubmission);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  // Diagnóstico
  const [showDiag, setShowDiag] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagData, setDiagData] = useState<DiagInfo | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(
    async (withQr = false) => {
      if (withQr) setLoading(true);
      else setChecking(true);
      setError("");

      try {
        const res = await fetch(`/api/whatsapp/connect?slug=${tenantSlug}${withQr ? "&qr=1" : ""}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "No se pudo consultar el estado de WhatsApp");
          if (withQr) setLoading(false);
          else setChecking(false);
          return;
        }

        setConfigured(data.configured !== false);
        setConnected(Boolean(data.connected));
        setState(data.state || "unknown");
        setTip(data.tip || "");

        if (data.connected || data.state === "open") {
          setQrCode(null);
          stopPolling();
        } else if (withQr && data.qr) {
          setQrCode(data.qr);
          stopPolling();
          pollTimerRef.current = setInterval(async () => {
            try {
              const pRes = await fetch(`/api/whatsapp/connect?slug=${tenantSlug}`);
              const pData = await pRes.json().catch(() => ({}));
              if (pData.connected || pData.state === "open") {
                setConnected(true);
                setState("open");
                setQrCode(null);
                setTip("¡WhatsApp vinculado con éxito!");
                stopPolling();
              }
            } catch {}
          }, 3000);
        } else if (withQr && !data.qr) {
          setError(data.error || data.message || "No se pudo generar el código QR");
        }
      } catch (err) {
        setError("Error de conexión al consultar WhatsApp");
      } finally {
        setLoading(false);
        setChecking(false);
      }
    },
    [tenantSlug, stopPolling]
  );

  useEffect(() => {
    checkStatus(false);
    return () => stopPolling();
  }, [checkStatus, stopPolling]);

  async function handleDisconnect() {
    if (!confirm("¿Deseas desvincular el WhatsApp de esta empresa?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tenantSlug, action: "disconnect" }),
      });
      if (res.ok) {
        setConnected(false);
        setState("close");
        setQrCode(null);
        setTip("");
        stopPolling();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "No se pudo desvincular");
      }
    } catch {
      setError("Error de red al desvincular");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTest() {
    if (!adminPhone.trim()) {
      setError("Ingresa un número de celular de prueba");
      return;
    }
    setTestSending(true);
    setTestStatus(null);
    setError("");
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: tenantSlug,
          action: "test",
          phone: adminPhone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.sent) {
        setTestStatus("¡Mensaje de prueba enviado exitosamente!");
        setTimeout(() => setTestStatus(null), 4000);
      } else {
        setError(data.error || "No se pudo enviar el mensaje");
      }
    } catch {
      setError("Error al enviar mensaje de prueba");
    } finally {
      setTestSending(false);
    }
  }

  async function handleRunDiag() {
    setDiagLoading(true);
    setShowDiag(true);
    try {
      const res = await fetch("/api/whatsapp/diag");
      const data = await res.json().catch(() => ({}));
      setDiagData(data);
    } catch {
      setDiagData({
        ok: false,
        configured: false,
        message: "No se pudo conectar con el endpoint de diagnóstico.",
      });
    } finally {
      setDiagLoading(false);
    }
  }

  function handleNotifyChange(checked: boolean) {
    setNotifyOnSubmission(checked);
    onAlertsChange?.(checked, adminPhone);
  }

  function handlePhoneChange(val: string) {
    setAdminPhone(val);
    onAlertsChange?.(notifyOnSubmission, val);
  }

  return (
    <div className="space-y-6">
      {/* TARJETA DE CONEXIÓN WHATSAPP */}
      <section className="p-5 sm:p-6 tl-card space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-2xl border transition-colors ${
                connected
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-white/5 text-slate-400 border-white/10"
              }`}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">WhatsApp de la Empresa</h2>
              <p className="text-xs text-slate-400">
                Vincula tu número escaneando el código QR para enviar notificaciones automáticas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunDiag}
              className="p-1.5 rounded-xl text-slate-400 hover:text-teal-300 hover:bg-white/5 border border-white/10 text-xs flex items-center gap-1"
              title="Diagnóstico de Evolution API"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Diagnóstico</span>
            </button>

            {connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Vinculado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-white/5 text-slate-400 border border-white/10">
                Sin vincular
              </span>
            )}
          </div>
        </div>

        {/* ALERTA DE NO CONFIGURADO */}
        {!configured && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Evolution API no configurada</p>
              <p className="text-amber-300/80 mt-0.5">
                Verifica las variables de Evolution API en el servidor (.evolution.local o EVOLUTION_API_KEY).
              </p>
            </div>
          </div>
        )}

        {/* MENSAJE DE ERROR */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{error}</p>
              {tip && <p className="text-red-300/80 mt-0.5">{tip}</p>}
            </div>
          </div>
        )}

        {/* PANEL DE DIAGNÓSTICO */}
        {showDiag && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-teal-500/30 text-xs space-y-3 animate-tl-fade-in">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2 font-bold text-teal-300">
                <Activity className="w-4 h-4" />
                Diagnóstico de Evolution API
              </div>
              <button
                type="button"
                onClick={() => setShowDiag(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {diagLoading ? (
              <div className="flex items-center gap-2 text-slate-400 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                Ejecutando pruebas de conexión con el servidor de WhatsApp...
              </div>
            ) : diagData ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-400">Servidor API:</span>{" "}
                    <span className="font-mono text-white">{diagData.apiHost || "—"}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-400">Longitud Key:</span>{" "}
                    <span className="font-mono text-white">{diagData.keyLen ? `${diagData.keyLen} chars` : "0"}</span>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-400">Prueba Conexión:</span>{" "}
                    <span className={diagData.probeOk ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                      {diagData.probeOk ? "HTTP 200 OK" : `Error (${diagData.probeStatus || "Fallo"})`}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <span className="text-slate-400">Permiso Creación:</span>{" "}
                    <span className={diagData.canCreate ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                      {diagData.canCreate ? "Permitido (Global)" : `Denegado (${diagData.createStatus})`}
                    </span>
                  </div>
                </div>

                {diagData.hint && (
                  <p className="text-teal-200 bg-teal-500/10 p-2.5 rounded-lg border border-teal-500/20">
                    💡 {diagData.hint}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* CÓDIGO QR EN PANTALLA */}
        {qrCode && !connected && (
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/[0.02] border border-teal-500/30 text-center space-y-4 animate-tl-fade-in">
            <div className="p-3 bg-white rounded-2xl shadow-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCode}
                alt="Código QR de WhatsApp"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
              />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-bold text-white">Escanea con tu WhatsApp</p>
              <p className="text-xs text-slate-400">
                Abre WhatsApp en tu teléfono ➔ <strong>Dispositivos vinculados</strong> ➔{" "}
                <strong>Vincular un dispositivo</strong> y apunta la cámara a este código.
              </p>
              <p className="text-[11px] text-teal-400 animate-pulse pt-1">
                Esperando escaneo… se detectará automáticamente.
              </p>
            </div>
          </div>
        )}

        {/* ACCIONES DE CONEXIÓN */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!connected ? (
            <button
              type="button"
              disabled={loading || !configured}
              onClick={() => checkStatus(true)}
              className="tl-btn-primary text-xs"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <QrCode className="w-3.5 h-3.5" />
              )}
              {qrCode ? "Regenerar código QR" : "Mostrar código QR"}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleDisconnect}
              className="tl-btn-ghost text-xs text-red-300 hover:text-red-200 border-red-500/20 hover:bg-red-500/10"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Unlink className="w-3.5 h-3.5" />
              )}
              Desvincular WhatsApp
            </button>
          )}

          <button
            type="button"
            disabled={checking}
            onClick={() => checkStatus(false)}
            className="tl-btn-ghost text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            Comprobar conexión
          </button>
        </div>
      </section>

      {/* TARJETA DE ALERTAS AUTOMÁTICAS */}
      <section className="p-5 sm:p-6 tl-card space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Alertas de Nuevas Solicitudes</h2>
            <p className="text-xs text-slate-400">
              Recibe un aviso inmediato en tu WhatsApp cada vez que un postulante complete el formulario.
            </p>
          </div>
        </div>

        <div className="pt-2 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={notifyOnSubmission}
              onChange={(e) => handleNotifyChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/10 bg-slate-900 text-teal-500 focus:ring-teal-500"
            />
            <div className="text-xs">
              <p className="font-semibold text-white">Notificar al encargado de RRHH por WhatsApp</p>
              <p className="text-slate-400 mt-0.5">
                Envía un resumen de la postulación (nombre del candidato, vacante, sueldo aspirado y teléfono).
              </p>
            </div>
          </label>

          {notifyOnSubmission && (
            <div className="pl-7 space-y-3 animate-tl-fade-in">
              <div>
                <label className="tl-label" htmlFor="admin-phone">
                  Número de WhatsApp para recibir las alertas
                </label>
                <div className="flex gap-2">
                  <input
                    id="admin-phone"
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Ej. 809-555-1234 o 18095551234"
                    className="tl-input text-xs max-w-sm"
                  />
                  {connected && (
                    <button
                      type="button"
                      disabled={testSending || !adminPhone.trim()}
                      onClick={handleSendTest}
                      className="tl-btn-ghost text-xs whitespace-nowrap"
                    >
                      {testSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Enviar prueba
                    </button>
                  )}
                </div>
                {testStatus && <p className="mt-1.5 text-xs text-emerald-400">{testStatus}</p>}
                <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Formatos aceptados: República Dominicana (809, 829, 849) o internacional con código de país.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
