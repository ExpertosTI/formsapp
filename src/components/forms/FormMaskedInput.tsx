"use client";

import {
  formatCedula,
  formatPhoneLandline,
  formatPhoneMobile,
  maskForField,
  RD_FIELD_HINTS,
  type RdFieldMask,
} from "@/lib/rd-formats";

interface Props {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

const PLACEHOLDERS: Record<RdFieldMask, string> = {
  cedula: "402-1234567-8",
  "phone-mobile": "(809) 555-1234",
  "phone-landline": "555-1234",
};

export function FormMaskedInput({
  fieldKey,
  value,
  onChange,
  onFocus,
  required,
  placeholder,
  type = "text",
}: Props) {
  const mask = maskForField(fieldKey);
  const hint = RD_FIELD_HINTS[fieldKey];

  function handleChange(raw: string) {
    if (mask === "cedula") onChange(formatCedula(raw));
    else if (mask === "phone-mobile") onChange(formatPhoneMobile(raw));
    else if (mask === "phone-landline") onChange(formatPhoneLandline(raw));
    else onChange(raw);
  }

  return (
    <div>
      <input
        name={fieldKey}
        type={mask ? "tel" : type === "url" ? "url" : type}
        inputMode={mask ? "numeric" : undefined}
        required={required}
        placeholder={placeholder ?? (mask ? PLACEHOLDERS[mask] : undefined)}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={onFocus}
        className="form-input"
        autoComplete={mask?.startsWith("phone") ? "tel" : mask === "cedula" ? "off" : undefined}
      />
      {hint && <p className="mt-1.5 text-[11px] leading-snug form-hint">{hint}</p>}
    </div>
  );
}
