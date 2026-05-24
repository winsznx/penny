"use client";

import { QrCode } from "./QrCode";
import { CopyButton } from "./CopyButton";

type Props = {
  title: string;
  subtitle?: string;
  url: string;
  brand?: string;
  className?: string;
};

export function ShareCard({
  title,
  subtitle,
  url,
  brand = "Penny · pay-per-answer",
  className = "",
}: Props) {
  return (
    <div
      className={`flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-stone-border bg-white p-6 shadow-sm ${className}`}
    >
      <span className="text-[11px] uppercase tracking-[0.15em] text-stone-text font-mono">{brand}</span>

      <div>
        <h3 className="text-xl font-semibold text-midnight">{title}</h3>
        {subtitle && <p className="mt-2 text-sm text-stone-text line-clamp-3">{subtitle}</p>}
      </div>

      <div className="flex items-center justify-center rounded-xl border border-stone-border bg-white p-4">
        <QrCode value={url} size={208} alt={`QR for ${title}`} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="truncate font-mono text-xs text-stone-text hover:underline"
        >
          {url}
        </a>
        <CopyButton value={url} />
      </div>
    </div>
  );
}
