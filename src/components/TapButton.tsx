"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

const COOLDOWN_SEC = 18 * 60 * 60; // matches Penny.TAP_COOLDOWN

/**
 * Penny's "tap" retention loop — read-tap-write pattern. Reads `lastTap` and
 * `tapStreak` so the user sees their current run and an honest cooldown.
 * Disables itself client-side when the cooldown is unmet (chain enforces too).
 */
export function TapButton() {
  // Hooks-first: every hook must run on both chain branches so the order
  // stays stable across chain toggle. The Stacks gate is rendered AFTER.
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [nowSec, setNowSec] = useState(0);

  useEffect(() => {
    const initial = window.setTimeout(() => setNowSec(Math.floor(Date.now() / 1000)), 0);
    const id = window.setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 60_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(id);
    };
  }, []);

  const { data: last } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "lastTap",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address, refetchInterval: 60_000 },
  });

  const { data: run } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "tapStreak",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address, refetchInterval: 60_000 },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  const lastTs = typeof last === "bigint" ? Number(last) : 0;
  // nowSec is 0 on first paint (hydration-safe), so secondsLeft would compute
  // as the entire cooldown duration for cached lastTs values and flash "Wait
  // Xh Ym" disabled for one frame. Gate on nowSec > 0.
  const secondsLeft =
    lastTs === 0 || nowSec === 0 ? 0 : Math.max(0, lastTs + COOLDOWN_SEC - nowSec);
  const onCooldown = secondsLeft > 0;
  const runVal = run !== undefined ? Number(run) : 0;

  const canSubmit = isConnected && isPennyDeployed && !onCooldown && !mining && !isPending;

  function submit() {
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "tap",
      args: [],
    });
  }

  const cta = mining
    ? "Tapping…"
    : isPending
      ? "Confirm in wallet…"
      : isSuccess
        ? "Tapped ✓"
        : onCooldown
          ? `Wait ${prettyDuration(secondsLeft)}`
          : !isConnected
            ? "Connect to tap"
            : !isPennyDeployed
              ? "Contract offline"
              : "Tap for credits";

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Daily tap streak" />;
  }

  return (
    <div className="feature-card flex items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-stone-text mb-1">
          Daily tap streak
        </div>
        <div className="font-display font-bold text-2xl text-midnight">{runVal}</div>
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="btn-pill-dark text-sm disabled:opacity-40"
      >
        {cta}
      </button>
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
    </div>
  );
}

function prettyDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
