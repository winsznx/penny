"use client";

import { useState } from "react";

type Props = {
  presets: readonly { label: string; valueWei: bigint }[];
  onPick: (valueWei: bigint) => void;
  defaultIndex?: number;
  className?: string;
};

/**
 * Pill row for "pick a top-up amount" UIs. Single-select, keyboard navigable
 * via arrow keys when role="radiogroup" is the natural fit.
 */
export function StakePresetGroup({ presets, onPick, defaultIndex = 1, className = "" }: Props) {
  const [active, setActive] = useState(defaultIndex);
  return (
    <div role="radiogroup" className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((p, i) => {
        const selected = i === active;
        return (
          <button
            key={p.label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              setActive(i);
              onPick(p.valueWei);
            }}
            className={`rounded-full border px-3 py-1.5 text-sm transition ${
              selected
                ? "border-midnight bg-midnight text-white"
                : "border-stone-border bg-white text-midnight hover:border-midnight/50"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
