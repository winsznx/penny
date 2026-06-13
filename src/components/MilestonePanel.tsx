"use client";

import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

const THRESHOLDS: bigint[] = [10n, 100n, 1_000n, 10_000n];

/**
 * Milestone NFT claims at 10 / 100 / 1k / 10k settled messages.
 *
 * Reads the account's `messageCount` plus each `claimedMilestone(user, t)` so
 * we can render unlocked / unclaimed / claimed states accurately. One-tap
 * mint per milestone via `claimMilestone(threshold)`.
 */
export function MilestonePanel() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();

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

  const messageCount = account?.messageCount ?? 0n;

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Message milestones" />;
  }

  return (
    <div className="feature-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base text-midnight">Message milestones</h3>
        <span className="text-xs font-mono text-stone-text">
          settled: <span className="text-midnight font-medium">{messageCount.toString()}</span>
        </span>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {THRESHOLDS.map((t) => (
          <MilestoneCell key={t.toString()} threshold={t} reached={messageCount >= t} />
        ))}
      </ul>
      <p className="mt-4 text-xs text-stone-text leading-relaxed">
        Each badge is a one-shot SIP-721 mint, transferable once claimed. Claim only after the
        on-chain debit settles.
      </p>
    </div>
  );
}

function MilestoneCell({ threshold, reached }: { threshold: bigint; reached: boolean }) {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();

  const { data: claimed, refetch } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "claimedMilestone",
    args: address ? [address, threshold] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isPennyDeployed && !!address,
      refetchInterval: 60_000,
    },
  });

  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  const isClaimed = claimed === true || isSuccess;
  const canClaim = isConnected && isPennyDeployed && reached && !isClaimed && !mining && !isPending;

  function submit() {
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "claimMilestone",
      args: [threshold],
    });
    setTimeout(() => refetch().catch(() => undefined), 6_000);
  }

  const label = isClaimed
    ? "Owned"
    : mining
      ? "Minting…"
      : reached
        ? "Claim"
        : "Locked";

  return (
    <li
      className={`flex flex-col items-center justify-center text-center py-3 rounded-xl border ${
        isClaimed
          ? "border-emerald-200 bg-emerald-50/60"
          : reached
            ? "border-sky-blue/40 bg-sky-blue/5"
            : "border-stone-border bg-stone-surface"
      }`}
    >
      <div className="text-xl font-display font-bold text-midnight">
        {prettyThreshold(threshold)}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!canClaim}
        className={`mt-1 text-[11px] font-medium ${
          isClaimed
            ? "text-emerald-700"
            : canClaim
              ? "text-sky-blue underline"
              : "text-stone-text"
        }`}
      >
        {label}
      </button>
    </li>
  );
}

function prettyThreshold(t: bigint): string {
  if (t === 10_000n) return "10k";
  if (t === 1_000n) return "1k";
  return t.toString();
}
