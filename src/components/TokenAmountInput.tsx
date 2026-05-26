"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  max?: string;
  suffix?: string;
  placeholder?: string;
  className?: string;
};

/**
 * Numeric amount field with optional MAX button. Validates client-side to
 * digits + a single dot so the contract write doesn't have to bail on parse.
 */
export function TokenAmountInput({
  value,
  onChange,
  max,
  suffix = "cUSD",
  placeholder = "0.00",
  className = "",
}: Props) {
  const [touched, setTouched] = useState(false);
  const isValid = value === "" || /^\d*\.?\d*$/.test(value);
  return (
    <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 ${touched && !isValid ? "border-rose-300" : "border-stone-border"} ${className}`}>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!touched) setTouched(true);
        }}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-base tabular-nums text-midnight outline-none placeholder:text-stone-text"
      />
      <span className="font-mono text-xs uppercase tracking-widest text-stone-text">{suffix}</span>
      {max !== undefined && (
        <button
          type="button"
          onClick={() => onChange(max)}
          className="rounded-full border border-stone-border bg-stone-surface px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-stone-text hover:border-midnight/40"
        >
          MAX
        </button>
      )}
    </div>
  );
}
