"use client";

import { inputStyles } from "@/components/ui/Field";
import { formatThousands } from "@/lib/utils";

/** Campo de precio en Guaraníes con separador de miles en vivo. */
export function PriceInput({
  value,
  onChange,
  id,
  invalid,
  placeholder = "0",
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  id?: string;
  invalid?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-ink-soft">Gs.</span>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value ? formatThousands(value) : ""}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
          onChange(digits ? parseInt(digits, 10) : null);
        }}
        className={inputStyles(invalid, "pl-12 tabular-nums")}
      />
    </div>
  );
}
