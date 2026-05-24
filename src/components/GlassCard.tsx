import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-stone-border/80 bg-white/70 p-5 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}
