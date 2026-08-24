"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PowerOff,
  Send,
  Loader2,
  BellRing,
  HelpCircle,
} from "lucide-react";

interface Props {
  tenantSlug: string;
  initialPhone?: string;
  initialNotifyOnSubmission?: boolean;
  onAlertsChange: (notify: boolean, phone: string) => void;
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
  const [tip, setTip] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [notifyAdmin, setNotifyAdmin] = useState(initialNotifyOnSubmission);
  const [adminPhone, setAdminPhone] = useState(initialPhone);
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

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
          // Iniciar polling automático para detectar cuando escanee el QR
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
          setError(data.error || "No se pudo generar el código QR");
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
      alert("Por favor ingresa un número de celular");
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: tenantSlug, action: "test", phone: adminPhone }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.sent) {
        setTestResult({ ok: true, msg: "¡Mensaje de prueba enviado exitosamente!" });
      } else {
        setTestResult({
          ok: false,
          msg: data.error || (data.manualUrl ? "Enviado a través de enlace manual" : "No se pudo enviar"),
        });
      }
    } catch {
      setTestResult({ ok: false, msg: "Error al enviar mensaje de prueba" });
    } finally {
      setTestSending(false);
      setTimeout(() => setTestResult(null), 5000);
    }
  }

  function handleAlertsToggle(checked: boolean) {
    setNotifyAdmin(checked);
    onAlertsChange(checked, adminPhone);
  }

  function handlePhoneChange(val: string) {
    setAdminPhone(val);
    onAlertsChange(notifyAdmin, val);
  }

  return (
    <section className="space-y-6">
      {/* Tarjeta de Conexión QR */}
      <div className="p-5 sm:p-6 tl-card space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                connected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : qrCode
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "bg-slate-500/10 text-slate-400 border border-white/10"
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
            {connected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Vinculado
              </span>
            ) : qrCode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                <QrCode className="w-3.5 h-3.5" />
                Esperando escaneo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-slate-500/15 text-slate-300 border border-white/10">
                Sin vincular
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Acciones principales de escaneo */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {!connected ? (
            <button
              type="button"
              onClick={() => checkStatus(true)}
              disabled={loading}
              className="tl-btn-primary"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <QrCode className="w-4 h-4" />
              )}
              {qrCode ? "Regenerar código QR" : "Mostrar código QR"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={loading}
              className="tl-btn-ghost text-red-300 hover:text-red-200 hover:bg-red-500/10 border-red-500/20"
            >
              <PowerOff className="w-4 h-4" />
              Desvincular WhatsApp
            </button>
          )}

          <button
            type="button"
            onClick={() => checkStatus(false)}
            disabled={checking}
            className="tl-btn-ghost"
            title="Refrescar estado"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            Comprobar conexión
          </button>
        </div>

        {/* Vista del código QR activo */}
        {qrCode && !connected && (
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-4 max-w-sm mx-auto animate-tl-scale-in">
            <p className="text-xs font-semibold text-white">Escanea este código con WhatsApp</p>
            <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
              <img
                src={qrCode}
                alt="Código QR de WhatsApp"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>
            <div className="text-left bg-black/20 p-3.5 rounded-xl border border-white/5 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Instrucciones:
              </p>
              <ol className="text-xs text-slate-300 list-decimal list-inside space-y-1">
                <li>Abre WhatsApp en tu teléfono.</li>
                <li>Toca en <strong>Menú (⋮)</strong> o <strong>Ajustes</strong>.</li>
                <li>Selecciona <strong>Dispositivos vinculados</strong>.</li>
                <li>Toca en <strong>Vincular un dispositivo</strong> y apunta tu cámara a este código.</li>
              </ol>
            </div>
            <p className="text-[11px] text-slate-400 animate-pulse">
              Detectando escaneo automáticamente…
            </p>
          </div>
        )}

        {tip && !qrCode && (
          <p className="text-xs text-slate-400 bg-white/[0.02] p-3 rounded-xl border border-white/5">
            {tip}
          </p>
        )}
      </div>

      {/* Configuración de Notificaciones Automáticas */}
      <div className="p-5 sm:p-6 tl-card space-y-4">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Alertas de Nuevas Solicitudes</h3>
        </div>
        <p className="text-xs text-slate-400">
          Recibe un aviso inmediato en tu WhatsApp cada vez que un postulante complete el formulario.
        </p>

        <div className="space-y-4 pt-2">
          <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={notifyAdmin}
              onChange={(e) => handleAlertsToggle(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/5 text-teal-500 focus:ring-teal-400 shrink-0"
            />
            <div>
              <span className="font-semibold text-white">
                Notificar al encargado de RRHH por WhatsApp
              </span>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Envía un resumen de la postulación (nombre del candidato, vacante, sueldo aspirado y teléfono).
              </p>
            </div>
          </label>

          {notifyAdmin && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div>
                <label className="tl-label" htmlFor="admin-phone">
                  Número de celular para recibir alertas *
                </label>
                <div className="flex gap-2">
                  <input
                    id="admin-phone"
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="809-555-1234"
                    className="tl-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={testSending || !adminPhone.trim()}
                    className="tl-btn-ghost text-xs shrink-0"
                  >
                    {testSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Probar envío
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">
                  Formato dominicano con 10 dígitos (809, 829 o 849) o internacional con código de país.
                </p>
              </div>

              {testResult && (
                <p
                  className={`text-xs ${
                    testResult.ok ? "text-emerald-400" : "text-red-400"
                  } animate-tl-fade-in`}
                >
                  {testResult.msg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
