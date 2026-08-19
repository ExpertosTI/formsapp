import type { LucideIcon } from "lucide-react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Flag,
  Heart,
  Home,
  Briefcase,
  DollarSign,
  GraduationCap,
  FileText,
  Car,
  Activity,
  Users,
  Clock,
  Wrench,
  Globe,
  Store,
  Shirt,
  Utensils,
  Headphones,
  TrendingUp,
  Package,
  Monitor,
  Stethoscope,
  BookOpen,
  HardHat,
  Shield,
  Sparkles,
  Check,
  X,
  CircleDot,
  CalendarDays,
} from "lucide-react";

export const GROUP_ICONS: Record<string, LucideIcon> = {
  "Información personal": User,
  "Perfil profesional": Briefcase,
  "Formación académica": GraduationCap,
  "Información adicional": Wrench,
};

export const FIELD_ICONS: Record<string, LucideIcon> = {
  area_aplicar: Briefcase,
  modalidad_compensacion: DollarSign,
  aporte_empresa: Sparkles,
  disposicion_capacitacion: TrendingUp,
  nombre: User,
  apellido: User,
  cedula: FileText,
  fecha_nacimiento: Calendar,
  lugar_nacimiento: MapPin,
  nacionalidad: Flag,
  sexo: User,
  estado_civil: Heart,
  direccion: Home,
  provincia: MapPin,
  ciudad: MapPin,
  sector: MapPin,
  celular: Phone,
  correo: Mail,
  tel_casa: Phone,
  oficio_profesion: Briefcase,
  sueldo_aspirado: DollarSign,
  rubros_laborales: Store,
  habilidades: Sparkles,
  red_profesional: Globe,
  experiencia: Briefcase,
  trabajando_actualmente: Clock,
  razon_dejar_empleo: FileText,
  tiempo_disponible: Clock,
  primaria: BookOpen,
  secundaria: BookOpen,
  universitaria: GraduationCap,
  especialidad: GraduationCap,
  estudia_actualmente: GraduationCap,
  dia_clases: CalendarDays,
  licencia_conducir: Car,
  vehiculo: Car,
  enfermedad: Stethoscope,
  practica_deporte: Activity,
  familiares: Users,
};

const RUBRO_ICONS: Record<string, LucideIcon> = {
  "Retail / Tiendas": Store,
  "Moda / Belleza": Shirt,
  Restaurantes: Utensils,
  "Servicio al cliente": Headphones,
  Ventas: TrendingUp,
  Administración: FileText,
  "Almacén / Logística": Package,
  "Caja / POS": DollarSign,
  Tecnología: Monitor,
  Salud: Stethoscope,
  Educación: BookOpen,
  Construcción: HardHat,
  Seguridad: Shield,
  Otro: Briefcase,
};

export function iconForField(key: string): LucideIcon {
  return FIELD_ICONS[key] ?? FileText;
}

export function iconForGroup(title: string): LucideIcon {
  return GROUP_ICONS[title] ?? FileText;
}

export function iconForRubro(rubro: string): LucideIcon {
  return RUBRO_ICONS[rubro] ?? Briefcase;
}

const AREA_ICONS: Record<string, LucideIcon> = {
  Cobranza: DollarSign,
  Vendedor: TrendingUp,
  "Gerente de ventas": Briefcase,
  Reclutador: Users,
  "Cualquiera de las anteriores": Sparkles,
};

const OPTION_ICONS: Record<string, LucideIcon> = {
  Sí: Check,
  No: X,
  "Sí, completamente": Check,
  "Sí, si recibo el acompañamiento necesario": Check,
  "No estoy seguro/a": CircleDot,
  "Sueldo fijo más comisión": DollarSign,
  "Solo sueldo fijo": DollarSign,
  "Solo comisión, siempre que permita generar más de RD$40,000 mensuales": TrendingUp,
  "Prefiero un sueldo fijo, aunque sea mínimo": DollarSign,
  Masculino: User,
  Femenino: User,
  "Soltero/a": Heart,
  "Casado/a": Heart,
  "Unión libre": Heart,
  "Divorciado/a": Heart,
  "Viudo/a": Heart,
  Inmediato: Clock,
  "En 1 semana": Clock,
  "En 2 semanas": Clock,
  "En 1 mes": Calendar,
  "A convenir": Calendar,
  Lunes: CalendarDays,
  Martes: CalendarDays,
  Miércoles: CalendarDays,
  Jueves: CalendarDays,
  Viernes: CalendarDays,
  Sábado: CalendarDays,
  Domingo: CalendarDays,
};

const PROFESION_ICONS: Record<string, LucideIcon> = {
  "Vendedor/a": TrendingUp,
  "Cajero/a": DollarSign,
  Recepcionista: Headphones,
  "Asistente administrativo": FileText,
  "Supervisor/a": Users,
  Gerente: Briefcase,
  Almacenista: Package,
  "Mensajero/a": Package,
  "Conductor/a": Car,
  Seguridad: Shield,
  Limpieza: Sparkles,
  "Cocinero/a": Utensils,
  "Mesero/a": Utensils,
  Barista: Utensils,
  "Estilista / Belleza": Shirt,
  "Técnico en informática": Monitor,
  "Contador/a": FileText,
  "Enfermero/a": Stethoscope,
  "Call center": Headphones,
  Estudiante: GraduationCap,
  Otro: CircleDot,
};

export function iconForOption(label: string, fieldKey?: string): LucideIcon {
  if (fieldKey === "area_aplicar") return AREA_ICONS[label] ?? Briefcase;
  if (fieldKey === "oficio_profesion") return PROFESION_ICONS[label] ?? Briefcase;
  if (fieldKey === "rubros_laborales") return iconForRubro(label);
  return OPTION_ICONS[label] ?? CircleDot;
}

export function parseSkills(raw: unknown): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1);
}
