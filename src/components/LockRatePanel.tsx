"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { pennyAbi } from "@/lib/abi/penny";
import {
  HAIKU_TIER,
  OPUS_TIER,
  PENNY_ADDRESS,
  SONNET_TIER,
  isPennyDeployed,
} from "@/lib/wagmi";

const TIERS = [
  { id: HAIKU_TIER, label: "Haiku 4.5" },
  { id: SONNET_TIER, label: "Sonnet 4.6" },
  { id: OPUS_TIER, label: "Opus 4.7" },
] as const;

const DURATIONS = [
  { label: "1 hr", seconds: 60 * 60 },
  { label: "6 hrs", seconds: 6 * 60 * 60 },
  { label: "24 hrs", seconds: 24 * 60 * 60 },
  { label: "3 days", seconds: 3 * 24 * 60 * 60 },
  { label: "7 days", seconds: 7 * 24 * 60 * 60 },
] as const;

/**
 * Lock the current per-message rate of a chosen tier for a chosen duration.
 * Once active, any debit during the window uses the locked rate even if the
 * tier price moves upward. Surfaces the live `rateLockUntil` + `lockedRate`
 * for the connected wallet so the user can see when the lock expires.
 */
export function LockRatePanel() {
  const { address, isConnected } = useAccount();
  const [tierIdx, setTierIdx] = useState(0);
  const [secondsIdx, setSecondsIdx] = useState(2); // default to 24 hrs

  const { data: account } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "getAccount",
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && isPennyDeployed && !!address,
      refetchInterval: 30_000,
    },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });

  const lockedUntil = account?.rateLockUntil ?? 0n;
  const lockedRate = account?.lockedRate ?? 0n;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const lockActive = lockedUntil > now;
  const secondsRemaining = lockActive ? Number(lockedUntil - now) : 0;

  const submit = () => {
    if (!isConnected || !isPennyDeployed) return;
    const tier = TIERS[tierIdx];
    const duration = DURATIONS[secondsIdx];
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "lockRate",
      args: [tier.id, BigInt(duration.seconds)],
    });
  };

  const disabled = !isConnected || !isPennyDeployed || mining || isPending;

  return (
    <div className="feature-card space-y-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display font-bold text-lg text-midnight">Lock the rate</h3>
        <span className="text-[11px] font-mono uppercase tracking-widest text-stone-text">
          insulate your session
        </span>
      </div>
      <p className="text-sm text-stone-text">
        Pick a tier + duration. While the lock is active your debits price at the snapshot rate
        regardless of admin tier updates.
      </p>

      <LockStatus
        active={lockActive}
        remainingSeconds={secondsRemaining}
        lockedRate={lockedRate}
      />

      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-stone-text mb-2">
          tier
        </div>
        <div className="flex flex-wrap gap-2">
          {TIERS.map((t, idx) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTierIdx(idx)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                tierIdx === idx
                  ? "border-sky-blue bg-sky-blue/10 text-sky-blue"
                  : "border-stone-border text-stone-text hover:text-midnight"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[11px] font-mono uppercase tracking-widest text-stone-text mb-2">
          duration
        </div>
        <div className="flex flex-wrap gap-2">
          {DURATIONS.map((d, idx) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setSecondsIdx(idx)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                secondsIdx === idx
                  ? "border-midnight bg-midnight text-white"
                  : "border-stone-border text-stone-text hover:text-midnight"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="btn-pill-dark w-full text-sm disabled:opacity-40"
      >
        {mining
          ? "Locking…"
          : isPending
            ? "Confirm in wallet"
            : lockActive
              ? "Replace current lock"
              : `Lock ${TIERS[tierIdx].label} for ${DURATIONS[secondsIdx].label}`}
      </button>

      {hash && (
        <button type="button" onClick={() => reset()} className="text-xs text-stone-text underline">
          reset
        </button>
      )}

      {!isConnected && (
        <p className="text-[12px] text-stone-text">Connect a wallet to lock a rate.</p>
      )}
      {isConnected && !isPennyDeployed && (
        <p className="text-[12px] text-amber-700">
          Penny contract not configured — locks go live once NEXT_PUBLIC_PENNY_ADDRESS is wired.
        </p>
      )}
    </div>
  );
}

function LockStatus({
  active,
  remainingSeconds,
  lockedRate,
}: {
  active: boolean;
  remainingSeconds: number;
  lockedRate: bigint;
}) {
  if (!active) {
    return (
      <div className="rounded-lg bg-stone-surface border border-stone-border px-4 py-3 text-xs text-stone-text font-mono">
        No active lock — debits use the live tier rate.
      </div>
    );
  }
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const remainingLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return (
    <div className="rounded-lg bg-sky-blue/10 border border-sky-blue/40 px-4 py-3 text-xs text-midnight">
      Locked at{" "}
      <span className="font-mono">${Number(formatUnits(lockedRate, 18)).toFixed(4)}</span> per
      message · expires in <span className="font-mono">{remainingLabel}</span>
    </div>
  );
}
