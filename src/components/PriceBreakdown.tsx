import { formatCusd } from "@/lib/cusd";

type Row = { label: string; amount: bigint };

type Props = {
  rows: Row[];
  total?: bigint;
  className?: string;
};

/**
 * Itemised cost preview — used inside the topup modal + the dispute panel
 * so users see line-item breakdown before confirming a tx.
 */
export function PriceBreakdown({ rows, total, className = "" }: Props) {
  const computedTotal = total ?? rows.reduce((sum, r) => sum + r.amount, 0n);
  return (
    <dl className={`flex flex-col gap-1 font-mono text-xs ${className}`}>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-stone-text">
          <dt>{r.label}</dt>
          <dd className="tabular-nums">{formatCusd(r.amount, 4)} cUSD</dd>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t border-stone-border pt-1 text-midnight">
        <dt className="font-semibold uppercase tracking-widest">Total</dt>
        <dd className="font-semibold tabular-nums">{formatCusd(computedTotal, 4)} cUSD</dd>
      </div>
    </dl>
  );
}
