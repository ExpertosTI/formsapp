"use client";

import { formatCedula, formatPhoneRD, maskForField } from "@/lib/rd-formats";

interface Props {
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

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

  function handleChange(raw: string) {
    if (mask === "cedula") onChange(formatCedula(raw));
    else if (mask === "phone") onChange(formatPhoneRD(raw));
    else onChange(raw);
  }

  const displayPlaceholder =
    placeholder ??
    (mask === "cedula" ? "000-0000000-0" : mask === "phone" ? "(809) 000-0000" : undefined);

  return (
    <input
      name={fieldKey}
      type={mask ? "tel" : type === "url" ? "url" : type}
      inputMode={mask ? "numeric" : undefined}
      required={required}
      placeholder={displayPlaceholder}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={onFocus}
      className="form-input"
      autoComplete={mask === "phone" ? "tel" : mask === "cedula" ? "off" : undefined}
    />
  );
}
