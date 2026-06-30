"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  submissionId: string;
  className?: string;
}

interface Insight {
  summary: string;
  highlights: string[];
  suggestedPositions?: string[];
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
    <div className={cn("tl-card p-4 sm:p-5", className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/15">
          {loading ? (
            <Loader2 className="w-4 h-4 text-violet-300 animate-spin" />
          ) : (
            <FileText className="w-4 h-4 text-violet-300" />
          )}
        </div>
        <p className="text-sm font-semibold text-white">Resumen del perfil</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 rounded tl-shimmer bg-white/5" />
          <div className="h-3 w-4/5 rounded tl-shimmer bg-white/5" />
        </div>
      ) : insight ? (
        <>
          <p className="text-sm leading-relaxed text-slate-300">{insight.summary}</p>
          {insight.suggestedPositions && insight.suggestedPositions.length > 0 && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider text-teal-400">
                <Briefcase className="w-3.5 h-3.5" />
                Encaja en
              </p>
              <div className="flex flex-wrap gap-1.5">
                {insight.suggestedPositions.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-teal-500/10 text-teal-200 border border-teal-500/20">
                    <Briefcase className="w-3 h-3 opacity-70" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
          {insight.highlights.length > 0 && (
            <ul className="mt-3 space-y-2">
              {insight.highlights.map((h, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-400">
                  <span className="text-teal-400 shrink-0">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
