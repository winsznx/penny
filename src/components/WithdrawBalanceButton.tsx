"use client";

import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { pennyAbi } from "@/lib/abi/penny";
import { PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

/**
 * Pull unused cUSD back out of the vault. Reads the current balance so the
 * "Max" preset always matches what's actually in the contract for the
 * connected wallet — there's no UI path to ask for more than you have.
 */
export function WithdrawBalanceButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<number | "">("");

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Withdrawals" />;
  }

  const { data: balance, refetch: refetchBalance } = useReadContract({
    abi: pennyAbi,
    address: PENNY_ADDRESS,
    functionName: "balanceOfAccount",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address, refetchInterval: 30_000 },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  const balanceBn = (balance as bigint | undefined) ?? 0n;
  const balanceStr = Number(formatUnits(balanceBn, 18)).toFixed(4);

  const wei = typeof amount === "number" && amount > 0 ? parseUnits(amount.toString(), 18) : 0n;
  const enabled =
    isConnected && isPennyDeployed && balanceBn > 0n && wei > 0n && wei <= balanceBn && !mining && !isPending;

  function submit() {
    if (!enabled) return;
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "withdrawBalance",
      args: [wei],
    });
  }

  // refresh on confirm so the balance pill catches up
  if (confirmed && balanceBn > 0n && hash) {
    void refetchBalance();
  }

  return (
    <div className="rounded-xl border border-stone-border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-midnight text-sm">Withdraw balance</span>
        <span className="font-mono text-xs text-stone-text">
          available <span className="text-midnight">${balanceStr}</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-text text-sm font-mono">
            $
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.001"
            value={amount === "" ? "" : amount}
            placeholder="0.00"
            onChange={(e) => {
              const v = e.target.value;
              setAmount(v === "" ? "" : Math.max(0, Number(v)));
            }}
            disabled={!isConnected || !isPennyDeployed}
            className="w-full pl-7 pr-3 py-2 rounded-lg border border-stone-border bg-warm-stone font-mono text-sm text-midnight disabled:opacity-40"
          />
        </div>
        <button
          type="button"
          onClick={() => setAmount(Number(formatUnits(balanceBn, 18)))}
          disabled={balanceBn === 0n}
          className="px-3 py-2 rounded-lg border border-stone-border font-mono text-xs text-stone-text hover:text-midnight disabled:opacity-40"
        >
          Max
        </button>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!enabled}
        className="w-full btn-pill-dark text-sm disabled:opacity-40"
      >
        {mining ? "Mining…" : isPending ? "Waiting for wallet…" : "Withdraw to wallet"}
      </button>

      {hash && (
        <div className="text-xs text-stone-text flex items-center justify-between">
          <span>
            tx <span className="text-midnight">{hash.slice(0, 10)}…</span>
          </span>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
      )}
      {confirmed && (
        <p className="text-xs text-emerald-600">
          Withdrew. Funds land back in your wallet on next block.
        </p>
      )}

      {!isConnected && (
        <p className="text-xs text-stone-text">Connect a wallet to withdraw.</p>
      )}
      {isConnected && !isPennyDeployed && (
        <p className="text-xs text-amber-600">
          Penny contract not yet deployed — withdraw goes live once it&apos;s on chain.
        </p>
      )}
    </div>
  );
}
