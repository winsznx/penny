"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { stringToHex, keccak256 } from "viem";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";
import { formatCusd } from "@/lib/cusd";

const HAIKU = keccak256(stringToHex("haiku-4-5"));
const SONNET = keccak256(stringToHex("sonnet-4-6"));
const OPUS = keccak256(stringToHex("opus-4-7"));

const PRESETS = [
  { id: HAIKU, label: "Haiku" },
  { id: SONNET, label: "Sonnet" },
  { id: OPUS, label: "Opus" },
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
    args: address ? [address, HAIKU] : undefined,
    query: { enabled },
  });
  const sonnet = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "effectiveRate",
    args: address ? [address, SONNET] : undefined,
    query: { enabled },
  });
  const opus = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "effectiveRate",
    args: address ? [address, OPUS] : undefined,
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
