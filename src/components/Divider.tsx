export function Divider({ label, className = "" }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={`border-t border-stone-border ${className}`} />;
  }
  return (
    <div
      className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.15em] text-stone-text font-mono ${className}`}
    >
      <span className="flex-1 border-t border-stone-border" />
      <span>{label}</span>
      <span className="flex-1 border-t border-stone-border" />
    </div>
  );
}
