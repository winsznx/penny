"use client";

import { useState } from "react";
import { erc20Abi, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { pennyAbi } from "@/lib/abi/penny";
import { CUSD_ADDRESS, PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

const PRESETS = [1, 5, 10, 25];

/**
 * Two-step top-up: cUSD ERC20 approve, then Penny.topUp(amount).
 * Reads the existing allowance and skips the approve when sufficient.
 */
export function TopUpButton() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState<number>(5);
  const [phase, setPhase] = useState<"idle" | "approving" | "depositing">("idle");

  const wei = parseUnits(amount.toString(), 18);

  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, PENNY_ADDRESS] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address },
  });

  const { writeContract, data: hash, reset } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });

  const enabled = isConnected && isPennyDeployed && !mining;
  const needsApprove = !allowance || (allowance as bigint) < wei;

  function topUp() {
    if (!isConnected) return;
    if (needsApprove) {
      setPhase("approving");
      writeContract({
        abi: erc20Abi,
        address: CUSD_ADDRESS,
        functionName: "approve",
        args: [PENNY_ADDRESS, wei],
      });
      return;
    }
    setPhase("depositing");
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "topUp",
      args: [wei],
    });
  }

  const cta = mining
    ? phase === "approving"
      ? "Approving…"
      : "Depositing…"
    : needsApprove
      ? `Approve $${amount} cUSD`
      : `Top up $${amount}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`px-3 py-1.5 rounded-full font-mono text-xs border transition-colors ${
              amount === p
                ? "border-sky-blue text-sky-blue"
                : "border-stone-border text-stone-text hover:text-midnight"
            }`}
          >
            ${p}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={topUp}
        disabled={!enabled}
        className="btn-pill-dark text-sm disabled:opacity-40"
      >
        {cta}
      </button>
      {hash && (
        <button type="button" onClick={() => reset()} className="text-xs text-stone-text underline">
          reset
        </button>
      )}
    </div>
  );
}
