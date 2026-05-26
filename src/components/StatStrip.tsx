import type { ReactNode } from "react";
import { StatTile } from "./StatTile";

type Stat = { label: string; value: ReactNode; hint?: ReactNode };

type Props = { stats: Stat[]; className?: string };

/**
 * 2/4-column responsive grid of StatTile. Centralised so dashboard/landing
 * stop hand-rolling the same grid wrapper.
 */
export function StatStrip({ stats, className = "" }: Props) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 ${className}`}>
      {stats.map((s) => (
        <StatTile key={s.label} label={s.label} value={s.value} hint={s.hint} />
      ))}
    </div>
  );
}
