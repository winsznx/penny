type Props = { active?: boolean; className?: string; label?: string };

/**
 * Tiny pulsing dot used in headers to indicate live read activity.
 */
export function LiveDot({ active = true, className = "", label }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-stone-text"} ${active ? "animate-pulse" : ""}`}
      />
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-stone-text">
          {label}
        </span>
      )}
    </span>
  );
}
