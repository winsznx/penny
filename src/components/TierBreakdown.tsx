"use client";

import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { pennyAbi } from "@/lib/abi/penny";
import { HAIKU_TIER, OPUS_TIER, PENNY_ADDRESS, SONNET_TIER, isPennyDeployed } from "@/lib/wagmi";

type TierTuple = readonly [modelId: `0x${string}`, baseCostWei: bigint, active: boolean];

const TIER_CARDS = [
  { id: HAIKU_TIER, label: "Haiku 4.5", tag: "fast", accent: "#0EA5E9" },
  { id: SONNET_TIER, label: "Sonnet 4.6", tag: "default", accent: "#10B981" },
  { id: OPUS_TIER, label: "Opus 4.7", tag: "thorough", accent: "#F59E0B" },
] as const;

/**
 * Reads each canonical tier's id index via tierIdOf(modelId), then batch-reads
 * tiers(id) to surface the live baseCostWei. If a tier isn't registered yet
 * (id === 0) the card renders the placeholder dash.
 */
export function TierBreakdown() {
  const indexLookup = useReadContracts({
    contracts: TIER_CARDS.map((t) => ({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "tierIdOf" as const,
      args: [t.id] as const,
    })),
    query: { enabled: isPennyDeployed, refetchInterval: 60_000 },
  });

  const indices: bigint[] = (indexLookup.data ?? []).map((r) =>
    r?.status === "success" ? (r.result as bigint) : 0n,
  );

  const tierReads = useReadContracts({
    contracts: indices.map((id) => ({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "tiers" as const,
      args: [id] as const,
    })),
    query: { enabled: isPennyDeployed && indices.some((i) => i > 0n), refetchInterval: 60_000 },
  });

  const tiers = (tierReads.data ?? []).map((r) =>
    r?.status === "success" ? (r.result as unknown as TierTuple) : null,
  );

  return (
    <div className="grid sm:grid-cols-3 gap-3">
      {TIER_CARDS.map((card, idx) => {
        const id = indices[idx] ?? 0n;
        const tier = tiers[idx];
        const registered = id > 0n && tier !== null;
        const active = registered ? tier[2] : false;
        const costWei = registered ? tier[1] : 0n;
        const costStr = registered
          ? `$${Number(formatUnits(costWei, 18)).toFixed(4)} / msg`
          : isPennyDeployed
            ? "unregistered"
            : "—";
        return (
          <div
            key={card.label}
            className="rounded-xl bg-stone-surface border border-stone-border p-4"
            style={{ borderTop: `3px solid ${card.accent}` }}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display font-bold text-midnight">{card.label}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-text">
                {card.tag}
              </span>
            </div>
            <div className="mt-3 font-mono text-lg text-midnight">{costStr}</div>
            <div className="mt-1 text-xs text-stone-text">
              {registered ? (active ? "active" : "paused by admin") : "not yet on chain"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
