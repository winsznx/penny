"use client";

import { useNowSec } from "@/lib/useNowSec";

type Props = { targetSec: number | bigint; label?: string; expiredLabel?: string; className?: string };

export function CountdownPill({ targetSec, label = "in", expiredLabel = "passed", className = "" }: Props) {
  const nowSec = useNowSec();
  const target = typeof targetSec === "bigint" ? Number(targetSec) : targetSec;
  if (nowSec === 0) {
    return <span className={`inline-flex rounded-full border border-stone-border bg-stone-surface px-2 py-0.5 font-mono text-[11px] text-stone-text ${className}`}>{label}</span>;
  }
  const diff = target - nowSec;
  const expired = diff <= 0;
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 font-mono text-[11px] ${
        expired ? "border-rose-200 bg-rose-50 text-rose-700" : "border-stone-border bg-stone-surface text-stone-text"
      } ${className}`}
    >
      {label} {expired ? expiredLabel : fmt(diff)}
    </span>
  );
}

function fmt(diff: number): string {
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
