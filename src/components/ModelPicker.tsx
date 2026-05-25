"use client";

import { useState } from "react";
import { PENNY_MODELS, type PennyModel } from "@/lib/pennyModels";

type Props = { onPick?: (id: PennyModel) => void; defaultIndex?: number; className?: string };

export function ModelPicker({ onPick, defaultIndex = 0, className = "" }: Props) {
  const [active, setActive] = useState(defaultIndex);
  return (
    <div role="radiogroup" className={`grid grid-cols-3 gap-2 ${className}`}>
      {PENNY_MODELS.map((m, i) => {
        const selected = active === i;
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              setActive(i);
              onPick?.(m);
            }}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
              selected
                ? "border-midnight bg-midnight text-white"
                : "border-stone-border bg-white text-midnight hover:border-midnight/40"
            }`}
          >
            <div className="font-semibold">{m.label}</div>
            <div
              className={`mt-0.5 font-mono text-[10px] uppercase tracking-widest ${
                selected ? "text-white/70" : "text-stone-text"
              }`}
            >
              {m.tagline}
            </div>
          </button>
        );
      })}
    </div>
  );
}
