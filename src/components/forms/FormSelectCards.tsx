"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { iconForOption } from "@/lib/field-icons";

interface Props {
  fieldKey: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  theme: { primary: string; accent: string };
  columns?: 2 | 3;
}

export function FormSelectCards({
  fieldKey,
  options,
  value,
  onChange,
  onFocus,
  theme,
  columns = 2,
}: Props) {
  return (
    <div
      className={`grid gap-2 ${columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
      onFocus={onFocus}
    >
      {options.map((opt) => {
        const selected = value === opt;
        const Icon = iconForOption(opt, fieldKey);
        return (
          <OptionCard
            key={opt}
            label={opt}
            icon={Icon}
            selected={selected}
            theme={theme}
            onClick={() => onChange(opt)}
          />
        );
      })}
      <input type="hidden" name={fieldKey} value={value} />
    </div>
  );
}

interface MultiProps {
  fieldKey: string;
  options: string[];
  values: string[];
  onToggle: (option: string) => void;
  onFocus?: () => void;
  theme: { primary: string; accent: string };
  columns?: 2 | 3;
}

export function FormMultiSelectCards({
  fieldKey,
  options,
  values,
  onToggle,
  onFocus,
  theme,
  columns = 2,
}: MultiProps) {
  return (
    <div
      className={`grid gap-2 ${columns === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}
      onFocus={onFocus}
    >
      {options.map((opt) => {
        const selected = values.includes(opt);
        const Icon = iconForOption(opt, fieldKey);
        return (
          <OptionCard
            key={opt}
            label={opt}
            icon={Icon}
            selected={selected}
            theme={theme}
            onClick={() => onToggle(opt)}
            compact={options.length > 6}
          />
        );
      })}
      <input type="hidden" name={fieldKey} value={values.join(", ")} />
    </div>
  );
}

function OptionCard({
  label,
  icon: Icon,
  selected,
  theme,
  onClick,
  compact,
}: {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  theme: { primary: string; accent: string };
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`form-option-card group relative flex items-center gap-2.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
        compact ? "px-3 py-2.5" : "px-3.5 py-3"
      } ${selected ? "form-option-card--selected text-white border-transparent" : ""}`}
      style={
        selected
          ? {
              background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
              boxShadow: `0 6px 20px -4px ${theme.primary}55`,
            }
          : undefined
      }
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
          compact ? "w-7 h-7" : "w-8 h-8"
        } ${selected ? "bg-white/20" : "bg-white/[0.06] group-hover:bg-white/[0.1]"}`}
      >
        <Icon className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </span>
      <span className={`flex-1 font-medium leading-tight ${compact ? "text-[11px]" : "text-xs"}`}>
        {label}
      </span>
      {selected && (
        <Check className={`shrink-0 opacity-90 ${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
      )}
    </button>
  );
}
