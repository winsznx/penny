"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { pennyAbi } from "@/lib/abi/penny";
import {
  HAIKU_TIER,
  OPUS_TIER,
  PENNY_ADDRESS,
  SONNET_TIER,
  isPennyDeployed,
} from "@/lib/wagmi";
import { formatCusd } from "@/lib/cusd";

// Reuse the canonical tier ids from wagmi.ts (padded-ASCII bytes32 matching
// the deploy script's seeded registry). Previously this file kept its own
// keccak256("haiku-4-5") form which doesn't match what the contract was
// registered with — `effectiveRate` for those ids returned PennyTierUnknown
// and the cost hints rendered "…" forever.
const PRESETS = [
  { id: HAIKU_TIER, label: "Haiku" },
  { id: SONNET_TIER, label: "Sonnet" },
  { id: OPUS_TIER, label: "Opus" },
] as const;

/**
 * Renders the next-message cost across all three tiers. Pulls effectiveRate
 * for the connected wallet so lock-rate discounts show up.
 */
export function MessageCostHint() {
  const { address, isConnected } = useAccount();
  const enabled = isConnected && isPennyDeployed && !!address;

  const haiku = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "effectiveRate",
    args: address ? [address, HAIKU_TIER] : undefined,
    query: { enabled },
  });
  const sonnet = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "effectiveRate",
    args: address ? [address, SONNET_TIER] : undefined,
    query: { enabled },
  });
  const opus = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "effectiveRate",
    args: address ? [address, OPUS_TIER] : undefined,
    query: { enabled },
  });

  const rates = useMemo(
    () => [
      { label: "Haiku", value: haiku.data as bigint | undefined },
      { label: "Sonnet", value: sonnet.data as bigint | undefined },
      { label: "Opus", value: opus.data as bigint | undefined },
    ],
    [haiku.data, sonnet.data, opus.data],
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {rates.map((r) => (
        <div
          key={r.label}
          className="rounded-lg border border-stone-border bg-white px-3 py-2"
        >
          <div className="font-mono text-[10px] uppercase tracking-widest text-stone-text">
            {r.label}
          </div>
          <div className="text-sm font-semibold tabular-nums text-midnight">
            {r.value === undefined ? "…" : `${formatCusd(r.value, 4)} cUSD`}
          </div>
        </div>
      ))}
    </div>
  );
}

export const PENNY_TIERS = PRESETS;
