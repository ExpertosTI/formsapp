import {
  Gauge,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  PenLine,
  Star,
  Timer,
} from "lucide-react";
import type { CandidateScore } from "@/lib/scoring";
import { getScoreColor } from "@/lib/scoring";
import type { LucideIcon } from "lucide-react";

interface Props {
  scoring: CandidateScore;
}

const DIM_ICONS: Record<string, LucideIcon> = {
  completeness: CheckCircle2,
  writing: PenLine,
  professionalism: Star,
  speed: Timer,
};

export function ScorePanel({ scoring }: Props) {
  const color = getScoreColor(scoring.grade);

  return (
    <div className="tl-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-400">
          <Gauge className="w-4 h-4" />
          Puntuación
        </p>
        <span className={`px-3 py-1.5 text-sm font-bold rounded-xl border ${color}`}>
          {scoring.overall} · {scoring.grade}
        </span>
      </div>

      <div className="space-y-3">
        {scoring.dimensions.map((d) => {
          const Icon = DIM_ICONS[d.key] ?? Gauge;
          return (
            <div key={d.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  {d.label}
                </span>
                <span className="text-xs font-bold text-white">{d.score}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-400 to-teal-400"
                  style={{ width: `${d.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {scoring.flags.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/15 space-y-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Revisar
          </p>
          {scoring.flags.map((f) => (
            <p key={f} className="text-xs text-amber-200/90 pl-5">{f}</p>
          ))}
        </div>
      )}

      {scoring.tips.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-teal-400">
            <Lightbulb className="w-3.5 h-3.5" />
            Notas
          </p>
          {scoring.tips.map((t) => (
            <p key={t} className="text-xs text-slate-400 pl-5">{t}</p>
          ))}
        </div>
      )}

      {scoring.telemetry && (
        <p className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-1 border-t border-white/[0.05]">
          <TrendingUp className="w-3 h-3" />
          Completó en {Math.round(scoring.telemetry.durationMs / 1000)} segundos
        </p>
      )}
    </div>
  );
}
