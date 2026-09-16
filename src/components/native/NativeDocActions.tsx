"use client";

import { useState } from "react";
import { Download, ExternalLink, Loader2, Share2 } from "lucide-react";
import { hapticImpact, openDoc, shareDoc } from "@/lib/native/open-doc";

interface Props {
  url: string;
  filename?: string;
  title?: string;
  compact?: boolean;
}

export function NativeDocActions({ url, filename, title = "Documento", compact }: Props) {
  const [busy, setBusy] = useState<"open" | "share" | null>(null);

  async function handleOpen() {
    setBusy("open");
    try {
      await hapticImpact("medium");
      await openDoc(url, { filename });
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(null);
    }
  }

  async function handleShare() {
    setBusy("share");
    try {
      await hapticImpact("light");
      await shareDoc(url, title);
    } catch {
      /* usuario canceló */
    } finally {
      setBusy(null);
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          disabled={!!busy}
          className="tl-btn-ghost text-xs py-2 px-3"
          title="Abrir con visor nativo"
        >
          {busy === "open" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Ver CV</span>
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={!!busy}
          className="tl-btn-ghost text-xs py-2 px-3"
          title="Compartir documento"
        >
          {busy === "share" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <a href={url} download={filename} className="tl-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
        <Download className="w-3.5 h-3.5" />
        Descargar
      </a>
      <button
        type="button"
        onClick={handleShare}
        disabled={!!busy}
        className="tl-btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5"
      >
        {busy === "share" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
        Compartir
      </button>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!!busy}
        className="tl-btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
      >
        {busy === "open" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
        Abrir nativo
      </button>
    </div>
  );
}
