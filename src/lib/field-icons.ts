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
} from "lucide-react";

export const GROUP_ICONS: Record<string, LucideIcon> = {
  "Información personal": User,
  "Perfil profesional": Briefcase,
  "Formación académica": GraduationCap,
  "Información adicional": Wrench,
};

export const FIELD_ICONS: Record<string, LucideIcon> = {
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
  for (const [label, icon] of Object.entries(RUBRO_ICONS)) {
    if (rubro.toLowerCase().includes(label.split("/")[0].trim().toLowerCase())) return icon;
  }
  return Briefcase;
}

export function parseSkills(raw: unknown): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  return s
    .split(/[,;\n]+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 1);
}
