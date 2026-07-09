"use client";

import { useEffect, useState } from "react";
import { getMunicipalities, getProvinces, getSectors } from "@/lib/rd-locations";

export interface RdLocationValues {
  provincia: string;
  ciudad: string;
  sector: string;
  direccion: string;
}

interface Props {
  defaults?: Partial<RdLocationValues>;
  onFocus?: () => void;
  onChange?: (values: RdLocationValues) => void;
}

export function RdLocationFields({ defaults, onFocus, onChange }: Props) {
  const [provincia, setProvincia] = useState(defaults?.provincia ?? "");
  const [ciudad, setCiudad] = useState(defaults?.ciudad ?? "");
  const [sector, setSector] = useState(defaults?.sector ?? "");
  const [direccion, setDireccion] = useState(defaults?.direccion ?? "");

  const municipios = provincia ? getMunicipalities(provincia) : [];
  const sectores = provincia && ciudad ? getSectors(provincia, ciudad) : [];

  useEffect(() => {
    if (provincia && ciudad && !getMunicipalities(provincia).includes(ciudad)) {
      setCiudad("");
      setSector("");
    }
  }, [provincia, ciudad]);

  useEffect(() => {
    if (provincia && ciudad && sector && !getSectors(provincia, ciudad).includes(sector)) {
      setSector("");
    }
  }, [provincia, ciudad, sector]);

  useEffect(() => {
    onChange?.({ provincia, ciudad, sector, direccion });
  }, [provincia, ciudad, sector, direccion, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <label className="form-label">Provincia *</label>
        <select
          name="provincia"
          required
          value={provincia}
          onChange={(e) => {
            setProvincia(e.target.value);
            setCiudad("");
            setSector("");
          }}
          onFocus={onFocus}
          className="form-input"
        >
          <option value="">Seleccionar provincia…</option>
          {getProvinces().map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Ciudad / Municipio *</label>
        <select
          name="ciudad"
          required
          value={ciudad}
          disabled={!provincia}
          onChange={(e) => {
            setCiudad(e.target.value);
            setSector("");
          }}
          onFocus={onFocus}
          className="form-input disabled:opacity-50"
        >
          <option value="">{provincia ? "Seleccionar ciudad…" : "Primero elige provincia"}</option>
          {municipios.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Sector / Barrio *</label>
        <select
          name="sector"
          required
          value={sector}
          disabled={!ciudad}
          onChange={(e) => setSector(e.target.value)}
          onFocus={onFocus}
          className="form-input disabled:opacity-50"
        >
          <option value="">{ciudad ? "Seleccionar sector…" : "Primero elige ciudad"}</option>
          {sectores.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="form-label">Dirección *</label>
        <input
          name="direccion"
          type="text"
          required
          value={direccion}
          onChange={(e) => setDireccion(e.target.value)}
          placeholder="Calle, número, referencia"
          onFocus={onFocus}
          className="form-input"
        />
      </div>
    </div>
  );
}
