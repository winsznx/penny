import { Tooltip } from "./Tooltip";

type Props = { children: React.ReactNode; help: React.ReactNode; className?: string };

/**
 * Inline label with a "?" hover-help glyph. Combines Tooltip with the standard
 * eyebrow label style so panels stop reinventing the pairing.
 */
export function HelpHint({ children, help, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-stone-text ${className}`}>
      {children}
      <Tooltip content={help}>
        <span
          aria-hidden
          className="grid h-4 w-4 place-items-center rounded-full border border-stone-border text-[10px]"
        >
          ?
        </span>
      </Tooltip>
    </span>
  );
}
