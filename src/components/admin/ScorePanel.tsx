import { Gauge, AlertTriangle, Lightbulb, TrendingUp } from "lucide-react";
import type { CandidateScore } from "@/lib/scoring";
import { getScoreColor } from "@/lib/scoring";

interface Props {
  scoring: CandidateScore;
}

export function ScorePanel({ scoring }: Props) {
  const color = getScoreColor(scoring.grade);

  return (
    <div className="tl-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-400">
          <Gauge className="w-3.5 h-3.5" />
          Puntuación del perfil
        </p>
        <span className={`px-2.5 py-1 text-sm font-bold rounded-lg border ${color}`}>
          {scoring.overall} · {scoring.grade}
        </span>
      </div>

      <div className="space-y-2">
        {scoring.dimensions.map((d) => (
          <div key={d.key}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-slate-500">{d.label}</span>
              <span className="font-semibold text-white">{d.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-teal-400 transition-all"
                style={{ width: `${d.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {scoring.flags.length > 0 && (
        <div className="space-y-1">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            Alertas
          </p>
          {scoring.flags.map((f) => (
            <p key={f} className="text-xs text-amber-200/90">· {f}</p>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-teal-400">
          <Lightbulb className="w-3 h-3" />
          Sugerencias
        </p>
        {scoring.tips.map((t) => (
          <p key={t} className="text-xs text-slate-400">· {t}</p>
        ))}
      </div>

      {scoring.telemetry && (
        <p className="flex items-center gap-1 text-[10px] text-slate-600">
          <TrendingUp className="w-3 h-3" />
          Tiempo de llenado: {Math.round(scoring.telemetry.durationMs / 1000)}s
        </p>
      )}
    </div>
  );
}
