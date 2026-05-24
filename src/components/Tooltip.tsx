"use client";

import { useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "bottom";
};

/**
 * Minimal css-only tooltip — no portal, no positioning library. Good enough
 * for hover-only hints that don't need to escape the parent stack.
 */
export function Tooltip({ children, content, side = "top" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-stone-border bg-white px-2 py-1 text-[11px] text-stone-text shadow-sm ${
            side === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
