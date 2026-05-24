import type { ReactNode } from "react";

type Props = { title: string; description?: ReactNode; action?: ReactNode; className?: string };

export function EmptyState({ title, description, action, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border border-stone-border bg-white px-6 py-16 text-center ${className}`}
    >
      <h3 className="text-lg font-semibold text-midnight">{title}</h3>
      {description && <p className="max-w-md text-sm text-stone-text">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
