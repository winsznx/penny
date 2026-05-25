import type { ReactNode } from "react";

type Tone = "info" | "warning" | "success";

const TONES: Record<Tone, { border: string; bg: string; fg: string; glyph: string }> = {
  info: { border: "border-sky-200", bg: "bg-sky-50", fg: "text-sky-800", glyph: "ⓘ" },
  warning: { border: "border-amber-200", bg: "bg-amber-50", fg: "text-amber-800", glyph: "⚠" },
  success: { border: "border-emerald-200", bg: "bg-emerald-50", fg: "text-emerald-800", glyph: "✓" },
};

type Props = { tone?: Tone; title?: string; children: ReactNode; className?: string };

export function InfoCallout({ tone = "info", title, children, className = "" }: Props) {
  const t = TONES[tone];
  return (
    <div className={`flex gap-3 rounded-xl border ${t.border} ${t.bg} ${t.fg} px-4 py-3 ${className}`}>
      <span aria-hidden className="text-base leading-none">
        {t.glyph}
      </span>
      <div className="text-sm">
        {title && <div className="font-semibold">{title}</div>}
        <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>
      </div>
    </div>
  );
}
