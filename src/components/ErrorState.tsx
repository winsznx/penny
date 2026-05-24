"use client";

import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: ReactNode;
  hint?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "That didn't go through",
  description,
  hint,
  onRetry,
  className = "",
}: Props) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-2xl border border-stone-border bg-white px-6 py-12 text-center ${className}`}
    >
      <span aria-hidden className="text-2xl">⚠︎</span>
      <h3 className="text-lg font-semibold text-midnight">{title}</h3>
      {description && <p className="max-w-md text-sm text-stone-text">{description}</p>}
      {hint && <p className="text-xs text-stone-text font-mono">{hint}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-1">
          Try again
        </button>
      )}
    </div>
  );
}
