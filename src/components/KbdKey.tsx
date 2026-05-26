import type { ReactNode } from "react";

type Props = { children: ReactNode; className?: string };

/**
 * Inline keyboard chip — used for "press / to focus" hints. Styled like a
 * physical keycap so it reads as a shortcut, not a value.
 */
export function KbdKey({ children, className = "" }: Props) {
  return (
    <kbd
      className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-stone-border bg-stone-surface px-1 font-mono text-[11px] text-stone-text shadow-[0_1px_0_var(--stone-border)] ${className}`}
    >
      {children}
    </kbd>
  );
}
