import type { LucideIcon } from "lucide-react";
import { iconForField, iconForGroup, iconForRubro, parseSkills } from "@/lib/field-icons";
import { getRubros } from "@/lib/candidate";
import type { SubmissionData } from "@/lib/candidate";
import { Sparkles } from "lucide-react";

interface FieldRow {
  key: string;
  label: string;
  value: string;
}

interface FieldGroup {
  title: string;
  fields: FieldRow[];
}

interface Props {
  groups: FieldGroup[];
  data: SubmissionData;
}

function FieldItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
      <div className="flex items-center justify-center w-9 h-9 shrink-0 rounded-lg bg-teal-500/10">
        <Icon className="w-4 h-4 text-teal-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm text-white whitespace-pre-wrap break-words">{value}</p>
      </div>
    </div>
  );
}

export function CandidateSkillsBlock({ data }: { data: SubmissionData }) {
  const rubros = getRubros(data);
  const skills = parseSkills(data.habilidades);

  if (!rubros.length && !skills.length) return null;

  return (
    <section className="p-4 sm:p-5 tl-card">
      <h2 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-wider uppercase text-teal-400">
        <Sparkles className="w-4 h-4" />
        Habilidades y rubros
      </h2>

      {rubros.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Rubros laborales</p>
          <div className="flex flex-wrap gap-2">
            {rubros.map((r) => {
              const Icon = iconForRubro(r);
              return (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-indigo-500/10 text-indigo-200 border border-indigo-500/20"
                >
                  <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                  {r}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">Habilidades</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-teal-500/10 text-teal-200 border border-teal-500/20"
              >
                <Sparkles className="w-3 h-3 opacity-70" />
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function CandidateFieldGroups({ groups }: { groups: FieldGroup[] }) {
  return (
    <>
      {groups.map((group) => {
        const GroupIcon = iconForGroup(group.title);
        const visible = group.fields.filter(
          (f) => !["rubros_laborales", "sectores_experiencia", "habilidades"].includes(f.key)
        );
        if (!visible.length) return null;

        return (
          <section key={group.title} className="p-4 sm:p-5 tl-card">
            <h2 className="flex items-center gap-2 mb-4 text-xs font-bold tracking-wider uppercase text-teal-400">
              <GroupIcon className="w-4 h-4" />
              {group.title}
            </h2>
            <div className="space-y-2">
              {visible.map((field) => (
                <FieldItem
                  key={field.key}
                  icon={iconForField(field.key)}
                  label={field.label}
                  value={field.value}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
