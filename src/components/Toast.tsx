"use client";

import { useToast } from "@/lib/useToast";

/**
 * Inline trigger so individual components can fire toasts without prop-drilling
 * the push callback through every level.
 */
export function ToastTrigger({
  text,
  variant = "info",
  children,
  className = "",
}: {
  text: string;
  variant?: "info" | "success" | "warning" | "danger";
  children: React.ReactNode;
  className?: string;
}) {
  const { push } = useToast();
  return (
    <button type="button" onClick={() => push(text, variant)} className={className}>
      {children}
    </button>
  );
}
