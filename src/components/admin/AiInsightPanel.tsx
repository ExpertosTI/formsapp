"use client";

import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  submissionId: string;
  className?: string;
}

interface Insight {
  summary: string;
  highlights: string[];
  suggestedStatus?: string;
  source: "ai" | "heuristic";
}

export function AiInsightPanel({ submissionId, className }: Props) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId }),
    })
      .then((r) => r.json())
      .then(setInsight)
      .finally(() => setLoading(false));
  }, [submissionId]);

  return (
    <div
      className={cn(
        "tl-card p-5 border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-teal-500/[0.04]",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/20">
          {loading ? (
            <Loader2 className="w-4 h-4 text-violet-300 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-violet-300" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Resumen inteligente</p>
          <span className="tl-badge-ai">
            {insight?.source === "ai" ? "IA" : "Auto"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 rounded tl-shimmer bg-white/5" />
          <div className="h-3 w-4/5 rounded tl-shimmer bg-white/5" />
        </div>
      ) : insight ? (
        <>
          <p className="text-sm leading-relaxed text-slate-300">{insight.summary}</p>
          {insight.highlights.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {insight.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-400">
                  <span className="text-teal-400">•</span>
                  {h}
                </li>
              ))}
            </ul>
          )}
          {insight.suggestedStatus && insight.suggestedStatus !== "nuevo" && (
            <p className="mt-3 text-[11px] text-violet-300/80">
              Sugerencia: considerar estado «{insight.suggestedStatus}»
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
