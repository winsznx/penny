import { TxLink } from "./TxLink";
import { Pill } from "./Pill";
import { shortHash } from "@/lib/format";
import { messageStatusLabel, messageStatusTone } from "@/lib/messageStatus";

type Props = {
  hash: string;
  modelLabel: string;
  costCusd: string;
  status: number;
  txHash?: string;
};

export function MessageHashRow({ hash, modelLabel, costCusd, status, txHash }: Props) {
  const tone = messageStatusTone(status);
  return (
    <li className="grid grid-cols-[1fr_70px_70px_90px] items-center gap-3 border-b border-stone-border py-3 last:border-b-0">
      <div className="min-w-0">
        <div className="font-mono text-[11px] text-stone-text">{shortHash(hash)}</div>
        {txHash && <TxLink hash={txHash} className="mt-0.5 block" />}
      </div>
      <div className="text-right font-mono text-xs text-stone-text">{modelLabel}</div>
      <div className="text-right font-mono text-xs tabular-nums text-midnight">{costCusd}</div>
      <div className="flex justify-end">
        <Pill tone={tone}>{messageStatusLabel(status)}</Pill>
      </div>
    </li>
  );
}
