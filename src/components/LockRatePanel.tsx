"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useConnect,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
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
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: connectPending } = useConnect();
  const [tierIdx, setTierIdx] = useState(0);
  const [secondsIdx, setSecondsIdx] = useState(2); // default to 24 hrs
  const [nowSec, setNowSec] = useState(0);

  useEffect(() => {
    const initial = window.setTimeout(() => setNowSec(Math.floor(Date.now() / 1000)), 0);
    const id = window.setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, []);

  const { data: account } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "getAccount",
    args: address ? [address] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isPennyDeployed && !!address,
      refetchInterval: 30_000,
    },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });

  // Reset any in-flight tx state when the user flips chain. Without this a
  // stale Celo lockRate hash keeps `useWaitForTransactionReceipt` polling on
  // wagmi after the user has moved to Stacks (and Stacks shows a celo-only
  // notice below, so the hash isn't even relevant).
  useEffect(() => {
    reset();
  }, [kind, reset]);

  const lockedUntil = account?.rateLockUntil ?? 0n;
  const lockedRate = account?.lockedRate ?? 0n;
  const now = BigInt(nowSec);
  // Gate on nowSec > 0 so a historical lockedUntil doesn't compute as
  // ~lockedUntil hours remaining on first paint while nowSec is still 0.
  const lockActive = nowSec > 0 && lockedUntil > now;
  const secondsRemaining = lockActive ? Number(lockedUntil - now) : 0;

  const submit = () => {
    // Lock-rate lives on the Celo contract; the Stacks branch above already
    // renders a celo-only notice. Guard submit() too so a connected wagmi
    // wallet still in Stacks mode can't fire a Celo write through the still-
    // mounted button.
    if (kind !== "celo") return;
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

  const disabled = kind !== "celo" || !isConnected || !isPennyDeployed || mining || isPending;

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

      {kind === "stacks" && (
        <div className="rounded-lg border border-stone-border bg-stone-surface px-4 py-3 text-xs text-stone-text">
          Rate locks live on the Celo contract. The Stacks build of Penny tops up and settles per
          message — switch to Celo to lock a tier.
        </div>
      )}

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
              aria-pressed={tierIdx === idx}
              onClick={() => setTierIdx(idx)}
              className={`px-3 py-1.5 min-h-[44px] rounded-full text-sm border transition-colors ${
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
              aria-pressed={secondsIdx === idx}
              onClick={() => setSecondsIdx(idx)}
              className={`px-3 py-1.5 min-h-[44px] rounded-full text-xs border transition-colors ${
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

      {!isConnected ? (
        <button
          type="button"
          onClick={() => {
            const first = connectors[0];
            if (first) connect({ connector: first });
          }}
          disabled={connectPending || connectors.length === 0}
          className="btn-pill-dark w-full text-sm disabled:opacity-40"
        >
          {connectPending ? "Opening wallet…" : "Connect wallet to lock rate"}
        </button>
      ) : (
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
        aria-busy={mining || isPending}
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
      )}

      {hash && (
        <div className="flex items-center gap-3 text-xs text-stone-text">
          <a
            href={`https://celoscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-sky-blue underline"
          >
            view tx ↗
          </a>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
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
