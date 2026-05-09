"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContract } from "wagmi";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

/**
 * Live read of the user's prepaid Penny balance via balanceOfAccount.
 * Refreshes on a 15s tick so debits/top-ups settle visibly without a manual refresh.
 */
export function BalancePill() {
  const { address, isConnected } = useAccount();

  const { data, isLoading } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "balanceOfAccount",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && isPennyDeployed && !!address,
      refetchInterval: 15_000,
    },
  });

  let label: string;
  if (!isConnected) label = "—";
  else if (!isPennyDeployed) label = "no contract";
  else if (isLoading) label = "loading…";
  else label = `$${Number(formatUnits((data as bigint) ?? 0n, 18)).toFixed(2)}`;

  return (
    <div className="bg-stone-surface px-4 py-2 rounded-full font-mono text-sm text-stone-text border border-stone-border flex items-center gap-2 shadow-inner">
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected && isPennyDeployed ? "bg-emerald-500" : "bg-stone-border"
        }`}
      />
      Balance:&nbsp;<span className="text-midnight font-bold">{label}</span>
    </div>
  );
}
