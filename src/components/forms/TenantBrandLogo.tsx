"use client";

import { useEffect, useState } from "react";
import { logoPublicUrl } from "@/lib/tenant-branding";

interface Props {
  name: string;
  logo?: string | null;
  tenantSlug?: string | null;
  primary: string;
  accent: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const sizes = {
  sm: { box: "w-12 h-12", text: "text-sm", img: "w-10 h-10" },
  md: { box: "w-16 h-16 sm:w-20 sm:h-20", text: "text-lg sm:text-xl", img: "w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem]" },
  lg: { box: "w-20 h-20 sm:w-24 sm:h-24", text: "text-xl sm:text-2xl", img: "w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20" },
};

export function TenantBrandLogo({
  name,
  logo,
  tenantSlug,
  primary,
  accent,
  size = "md",
  className = "",
}: Props) {
  const s = sizes[size];
  const src = logoPublicUrl(logo, tenantSlug);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-2xl border border-white/10 shadow-2xl overflow-hidden bg-white ${s.box} ${className}`}
        style={{
          boxShadow: `0 20px 40px -12px ${primary}66`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className={`object-contain ${s.img}`}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const letters = initials(name);

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-2xl border border-white/15 shadow-2xl overflow-hidden ${s.box} ${className}`}
      style={{
        background: `linear-gradient(145deg, ${primary}, ${accent}cc)`,
        boxShadow: `0 24px 48px -16px ${primary}88, inset 0 1px 0 rgba(255,255,255,0.2)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%)",
        }}
      />
      <span className={`relative font-bold tracking-tight text-white drop-shadow-sm ${s.text}`}>{letters}</span>
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
    </div>
  );
}
