"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { useStacksSession } from "@/chain/useStacksSession";
import { useStxBalance } from "@/chain/useStxBalance";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

/**
 * Live wallet balance pill. On Celo reads the user's prepaid Penny vault via
 * balanceOfAccount; on Stacks shows the connected wallet's STX balance from
 * Hiro. Refreshes on a 15s tick so debits/top-ups settle visibly.
 */
export function BalancePill() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const stxSession = useStacksSession();
  const stxBal = useStxBalance();

  const { data, isLoading } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "balanceOfAccount",
    args: address ? [address] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isPennyDeployed && !!address,
      refetchInterval: 15_000,
    },
  });

  let label: string;
  let live = false;
  if (kind === "stacks") {
    if (!stxSession.isConnected) label = "—";
    else if (stxBal.loading) label = "loading…";
    else label = `${(Number(stxBal.balanceMicroStx) / 1_000_000).toFixed(4)} STX`;
    live = stxSession.isConnected;
  } else {
    if (!isConnected) label = "—";
    else if (!isPennyDeployed) label = "no contract";
    else if (isLoading) label = "loading…";
    else label = `$${Number(formatUnits((data as bigint) ?? 0n, 18)).toFixed(2)}`;
    live = isConnected && isPennyDeployed;
  }

  return (
    <div className="bg-stone-surface px-4 py-2 rounded-full font-mono text-sm text-stone-text border border-stone-border flex items-center gap-2 shadow-inner">
      <span
        className={`w-2 h-2 rounded-full ${live ? "bg-emerald-500" : "bg-stone-border"}`}
      />
      Balance:&nbsp;<span className="text-midnight font-bold">{label}</span>
    </div>
  );
}
