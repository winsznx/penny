import type { ReactNode } from "react";

type Props = { label: string; value: ReactNode; hint?: ReactNode; className?: string };

export function StatTile({ label, value, hint, className = "" }: Props) {
  return (
    <div className={`rounded-2xl border border-stone-border bg-white px-5 py-6 ${className}`}>
      <div className="text-[11px] uppercase tracking-[0.15em] text-stone-text font-mono">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold leading-none tabular-nums text-midnight md:text-3xl">
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-stone-text font-mono">{hint}</div>}
    </div>
  );
}
