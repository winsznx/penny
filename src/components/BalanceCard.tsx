"use client";

import { useAccount, useReadContract } from "wagmi";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";
import { formatCusd } from "@/lib/cusd";
import { StatTile } from "./StatTile";
import { Skeleton } from "./Skeleton";

/**
 * Self-contained balance card — readContract internally, falls back to a
 * skeleton when not connected so layouts don't shift on hydration.
 */
export function BalanceCard() {
  const { address, isConnected } = useAccount();

  const { data, isLoading } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "balanceOfAccount",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address },
  });

  if (!isConnected || isLoading) {
    return <Skeleton className="h-24" />;
  }

  return (
    <StatTile
      label="Prepaid balance"
      value={`${formatCusd(data ?? 0n)} cUSD`}
      hint="Top up to keep chatting"
    />
  );
}
