"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  submissionId: string;
  isFavorite: boolean;
  className?: string;
}

export function FavoriteButton({ submissionId, isFavorite, className }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(isFavorite);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const next = active ? "revisado" : "favorito";
    try {
      const res = await fetch(`/api/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        setActive(!active);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={loading}
      title={active ? "Quitar de pendientes" : "Marcar para el futuro"}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-lg border transition-all",
        active
          ? "bg-pink-500/15 border-pink-500/30 text-pink-300"
          : "bg-white/[0.04] border-white/10 text-slate-500 hover:text-pink-300 hover:border-pink-500/20",
        loading && "opacity-50",
        className
      )}
    >
      <Star className={cn("w-4 h-4", active && "fill-pink-400")} />
    </button>
  );
}
