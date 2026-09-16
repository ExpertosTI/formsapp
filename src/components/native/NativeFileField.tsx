"use client";

import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { hapticImpact, isNativeApp, takeNativePhoto } from "@/lib/native/open-doc";

interface Props {
  name: string;
  required?: boolean;
  accept?: string;
  fileName?: string;
  onFile: (file: File) => void;
  onFocus?: () => void;
}

function acceptsImage(accept?: string) {
  if (!accept) return true;
  return accept.includes("image") || accept.includes("*");
}

export function NativeFileField({ name, required, accept, fileName, onFile, onFocus }: Props) {
  const [native, setNative] = useState(false);

  useEffect(() => {
    isNativeApp().then(setNative);
  }, []);

  async function handleCamera() {
    onFocus?.();
    const native = await isNativeApp();
    if (!native) return;
    try {
      await hapticImpact("light");
      const file = await takeNativePhoto(`${name}-${Date.now()}.jpg`);
      if (file) onFile(file);
    } catch {
      /* usuario canceló */
    }
  }

  return (
    <div className="space-y-2">
      <input
        name={name}
        type="file"
        required={required && !fileName}
        accept={accept}
        capture={name.toLowerCase().includes("foto") ? "environment" : undefined}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        onFocus={onFocus}
        className="form-input file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-black/10 file:text-inherit"
      />
      {native && acceptsImage(accept) && (
        <button
          type="button"
          onClick={handleCamera}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          Tomar foto con la cámara
        </button>
      )}
      {fileName && <p className="text-xs form-muted">Archivo: {fileName}</p>}
    </div>
  );
}
