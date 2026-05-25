import { addressUrl, txUrl } from "@/lib/celoscan";
import { shortAddr, shortHash } from "@/lib/format";

type Kind = "address" | "tx";

type Props = {
  kind: Kind;
  value: string;
  chainId?: number;
  className?: string;
};

const ICON: Record<Kind, string> = { address: "📇", tx: "↗" };

/**
 * Single-line "open on Celoscan" row. Tiny but consistent — we kept building
 * one-off versions in panels.
 */
export function CeloscanLinkRow({ kind, value, chainId, className = "" }: Props) {
  const url = kind === "address" ? addressUrl(value, chainId) : txUrl(value, chainId);
  const label = kind === "address" ? shortAddr(value) : shortHash(value);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-2 font-mono text-xs text-stone-text hover:text-midnight ${className}`}
    >
      <span aria-hidden>{ICON[kind]}</span>
      {label}
    </a>
  );
}
