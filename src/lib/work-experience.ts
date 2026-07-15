export type WorkDurationMode = "manual" | "periodo";

export interface WorkExperienceEntry {
  id: string;
  empresa: string;
  puesto: string;
  durationMode: WorkDurationMode;
  /** Texto libre: "2 años", "6 meses", etc. */
  tiempoManual: string;
  /** Periodo: YYYY-MM */
  desde: string;
  hasta: string;
  /** Si sigue trabajando ahí */
  actual: boolean;
}

export function emptyWorkEntry(): WorkExperienceEntry {
  return {
    id: `we_${Math.random().toString(36).slice(2, 9)}`,
    empresa: "",
    puesto: "",
    durationMode: "manual",
    tiempoManual: "",
    desde: "",
    hasta: "",
    actual: false,
  };
}

export function blankWorkEntry(id = "we_blank"): WorkExperienceEntry {
  return {
    id,
    empresa: "",
    puesto: "",
    durationMode: "manual",
    tiempoManual: "",
    desde: "",
    hasta: "",
    actual: false,
  };
}

export function parseWorkExperience(raw: string | null | undefined): WorkExperienceEntry[] {
  const text = String(raw ?? "").trim();
  if (!text) return [blankWorkEntry()];

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item) => {
        const row = (item ?? {}) as Partial<WorkExperienceEntry>;
        return {
          id: row.id || emptyWorkEntry().id,
          empresa: String(row.empresa ?? ""),
          puesto: String(row.puesto ?? ""),
          durationMode: row.durationMode === "periodo" ? "periodo" : "manual",
          tiempoManual: String(row.tiempoManual ?? ""),
          desde: String(row.desde ?? ""),
          hasta: String(row.hasta ?? ""),
          actual: Boolean(row.actual),
        };
      });
    }
  } catch {
    /* plain text legacy */
  }

  return [
    {
      ...emptyWorkEntry(),
      empresa: text,
      durationMode: "manual",
    },
  ];
}

export function serializeWorkExperience(entries: WorkExperienceEntry[]): string {
  const cleaned = entries
    .map((e) => ({
      ...e,
      empresa: e.empresa.trim(),
      puesto: e.puesto.trim(),
      tiempoManual: e.tiempoManual.trim(),
      desde: e.desde.trim(),
      hasta: e.hasta.trim(),
    }))
    .filter((e) => e.empresa || e.puesto || e.tiempoManual || e.desde || e.hasta);

  return cleaned.length ? JSON.stringify(cleaned) : "";
}

function formatMonth(ym: string): string {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-");
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${months[Number(m) - 1] ?? m} ${y}`;
}

export function formatWorkDuration(entry: WorkExperienceEntry): string {
  if (entry.durationMode === "periodo") {
    if (!entry.desde && !entry.hasta && !entry.actual) return "";
    const from = entry.desde ? formatMonth(entry.desde) : "—";
    const to = entry.actual ? "Actualidad" : entry.hasta ? formatMonth(entry.hasta) : "—";
    return `${from} → ${to}`;
  }
  return entry.tiempoManual.trim();
}

export function formatWorkExperienceDisplay(raw: string | null | undefined): string {
  const text = String(raw ?? "").trim();
  if (!text) return "";

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          const row = item as Partial<WorkExperienceEntry>;
          const entry: WorkExperienceEntry = {
            id: String(row.id ?? ""),
            empresa: String(row.empresa ?? "").trim(),
            puesto: String(row.puesto ?? "").trim(),
            durationMode: row.durationMode === "periodo" ? "periodo" : "manual",
            tiempoManual: String(row.tiempoManual ?? "").trim(),
            desde: String(row.desde ?? "").trim(),
            hasta: String(row.hasta ?? "").trim(),
            actual: Boolean(row.actual),
          };
          const duration = formatWorkDuration(entry);
          const parts = [entry.empresa, entry.puesto, duration].filter(Boolean);
          return parts.join(" · ");
        })
        .filter(Boolean)
        .join("\n");
    }
  } catch {
    /* legacy free text */
  }

  return text;
}

export function isWorkExperienceComplete(entries: WorkExperienceEntry[]): boolean {
  const filled = entries.filter((e) => e.empresa.trim() || e.puesto.trim());
  if (!filled.length) return false;

  return filled.every((e) => {
    if (!e.empresa.trim() || !e.puesto.trim()) return false;
    if (e.durationMode === "manual") return Boolean(e.tiempoManual.trim());
    return Boolean(e.desde.trim()) && (e.actual || Boolean(e.hasta.trim()));
  });
}
