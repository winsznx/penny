"use client";

import { useNowSec } from "@/lib/useNowSec";

type Props = {
  targetSec: number | bigint;
  label?: string;
  expiredLabel?: string;
  className?: string;
};

/**
 * Live countdown pill. Re-renders once a minute via the shared ticker, so
 * "5m left → 4m left → expired" transitions don't require a parent refetch.
 */
export function CountdownPill({
  targetSec,
  label = "until",
  expiredLabel = "expired",
  className = "",
}: Props) {
  const nowSec = useNowSec();
  const target = typeof targetSec === "bigint" ? Number(targetSec) : targetSec;
  if (nowSec === 0) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-stone-border bg-stone-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-stone-text ${className}`}>
        {label}
      </span>
    );
  }
  const diff = target - nowSec;
  const expired = diff <= 0;
  const value = expired ? expiredLabel : formatDiff(diff);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${
        expired ? "border-rose-200 bg-rose-50 text-rose-700" : "border-stone-border bg-stone-surface text-stone-text"
      } px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest ${className}`}
    >
      {label} {value}
    </span>
  );
}

function formatDiff(diff: number): string {
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
