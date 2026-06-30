/** Provincias, municipios y sectores/barrios de República Dominicana */

export type RdLocationTree = Record<string, Record<string, string[]>>;

export const RD_LOCATIONS: RdLocationTree = {
  "Distrito Nacional": {
    "Distrito Nacional": [
      "Zona Colonial",
      "Gazcue",
      "Ciudad Nueva",
      "Villa Consuelo",
      "San Carlos",
      "San Gerónimo",
      "Piantini",
      "Naco",
      "Evaristo Morales",
      "Bella Vista",
      "La Julia",
      "Los Prados",
      "Serrallés",
      "Mirador Norte",
      "Mirador Sur",
      "Los Ríos",
      "Honduras del Norte",
      "Villa Juana",
      "Gualey",
      "Capotillo",
      "Los Guandules",
      "Villa María",
      "Villa Francisca",
      "La Fe",
      "Los Alcarrizos (DN)",
      "Otros",
    ],
  },
  "Santo Domingo": {
    "Santo Domingo Este": [
      "Los Mina",
      "Villa Duarte",
      "Alma Rosa I",
      "Alma Rosa II",
      "Alma Rosa III",
      "Ciudad Juan Bosch",
      "Mendoza",
      "El Almirante",
      "Los Trinitarios",
      "San Luis",
      "Invi Cea",
      "Villa Faro",
      "Ozama",
      "Hainamosa",
      "La Caleta",
      "Boca Chica (SDE)",
      "Andrés",
      "La Ureña",
      "Otros",
    ],
    "Santo Domingo Norte": [
      "Villa Mella",
      "Sabana Perdida",
      "La Victoria",
      "Los Guaricanos",
      "El Tamarindo",
      "La Guáyiga",
      "Palmar de Ocoa",
      "Sabana Larga",
      "Otros",
    ],
    "Santo Domingo Oeste": [
      "Herrera",
      "Pantoja",
      "Los Alcarrizos",
      "Palmarejo",
      "Manoguayabo",
      "Engombe",
      "Hato Nuevo",
      "El Carril",
      "Boca de Cachón",
      "Pueblo Nuevo",
      "Otros",
    ],
    "Boca Chica": ["Boca Chica", "La Caleta", "Andrés", "La Ureña", "Otros"],
    "San Antonio de Guerra": ["San Antonio de Guerra", "Hato Viejo", "Otros"],
    "Pedro Brand": ["Pedro Brand", "La Cuaba", "Otros"],
    "Los Alcarrizos": ["Los Alcarrizos", "Palmarejo", "Otros"],
  },
  Santiago: {
    Santiago: [
      "Centro",
      "Los Jardines",
      "Gurabo",
      "Pontezuela",
      "Cienfuegos",
      "La Trinitaria",
      "Bella Vista",
      "Los Salados",
      "Licey al Medio (Santiago)",
      "Otros",
    ],
    "Licey al Medio": ["Licey al Medio", "Otros"],
    Tamboril: ["Tamboril", "Otros"],
    "Villa González": ["Villa González", "Otros"],
  },
  "San Cristóbal": {
    "San Cristóbal": [
      "Centro",
      "Hato Damas",
      "Higuero",
      "Villa Fundación",
      "Municipio",
      "Otros",
    ],
    "Villa Altagracia": ["Villa Altagracia", "Otros"],
    Yaguate: ["Yaguate", "Otros"],
    "Bajos de Haina": ["Bajos de Haina", "Otros"],
  },
  "La Vega": {
    "La Vega": ["Centro", "Río Verde", "Guzmancito", "Otros"],
    Constanza: ["Constanza", "Otros"],
    Jarabacoa: ["Jarabacoa", "Otros"],
  },
  "Puerto Plata": {
    "Puerto Plata": ["Centro", "Costambar", "Long Beach", "Otros"],
    Sosúa: ["Sosúa", "Cabarete", "Otros"],
    "San Felipe de Puerto Plata": ["Centro", "Otros"],
  },
  "La Altagracia": {
    Higüey: ["Higüey", "Verón", "Otros"],
    "Punta Cana": ["Bávaro", "Punta Cana", "Verón", "Otros"],
    "San Rafael del Yuma": ["Bávaro", "Otros"],
  },
  "San Pedro de Macorís": {
    "San Pedro de Macorís": ["Centro", "Miramar", "Los Jardines", "Otros"],
    "San José de los Llamos": ["San José de los Llamos", "Otros"],
    Quisqueya: ["Quisqueya", "Otros"],
  },
  Duarte: {
    "San Francisco de Macorís": ["Centro", "Villa Riva", "Otros"],
    "Villa Riva": ["Villa Riva", "Otros"],
    Pimentel: ["Pimentel", "Otros"],
  },
  Espaillat: {
    Moca: ["Moca", "Centro", "Otros"],
    "Gaspar Hernández": ["Gaspar Hernández", "Otros"],
    "Jamao al Norte": ["Jamao al Norte", "Otros"],
  },
  Azua: {
    Azua: ["Azua", "Centro", "Otros"],
    "Las Charcas": ["Las Charcas", "Otros"],
    "Padre Las Casas": ["Padre Las Casas", "Otros"],
  },
  Peravia: {
    Baní: ["Baní", "Centro", "Matanzas", "Otros"],
    Nizao: ["Nizao", "Otros"],
  },
  "San Juan": {
    "San Juan de la Maguana": ["San Juan", "Centro", "Otros"],
    "Bohechío": ["Bohechío", "Otros"],
  },
  Valverde: {
    Mao: ["Mao", "Centro", "Otros"],
    Esperanza: ["Esperanza", "Otros"],
  },
  "Monte Plata": {
    "Monte Plata": ["Monte Plata", "Centro", "Otros"],
    Bayaguana: ["Bayaguana", "Otros"],
  },
  "Hato Mayor": {
    "Hato Mayor": ["Hato Mayor", "Centro", "Otros"],
    "Sabana de la Mar": ["Sabana de la Mar", "Otros"],
  },
  "María Trinidad Sánchez": {
    Nagua: ["Nagua", "Otros"],
    Cabrera: ["Cabrera", "Otros"],
  },
  "Hermanas Mirabal": {
    Salcedo: ["Salcedo", "Otros"],
    Tenares: ["Tenares", "Otros"],
  },
  "Monseñor Nouel": {
    Bonao: ["Bonao", "Centro", "Otros"],
  },
};

export function getProvinces(): string[] {
  return Object.keys(RD_LOCATIONS).sort((a, b) => a.localeCompare(b, "es"));
}

export function getMunicipalities(province: string): string[] {
  const m = RD_LOCATIONS[province];
  if (!m) return [];
  return Object.keys(m).sort((a, b) => a.localeCompare(b, "es"));
}

export function getSectors(province: string, municipality: string): string[] {
  const sectors = RD_LOCATIONS[province]?.[municipality];
  if (!sectors) return ["Otros"];
  return [...sectors].sort((a, b) => {
    if (a === "Otros") return 1;
    if (b === "Otros") return -1;
    return a.localeCompare(b, "es");
  });
}

export function formatLocation(data: {
  provincia?: unknown;
  ciudad?: unknown;
  sector?: unknown;
  direccion?: unknown;
}): string {
  const parts = [data.sector, data.ciudad, data.provincia]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);
  const loc = parts.join(", ");
  const dir = String(data.direccion ?? "").trim();
  if (loc && dir) return `${dir} · ${loc}`;
  return dir || loc || "";
}
