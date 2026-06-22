"use client";

import { useEffect, useState } from "react";
import { erc20Abi, isAddress, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { pennyAbi } from "@/lib/abi/penny";
import { CUSD_ADDRESS, PENNY_ADDRESS, isPennyDeployed } from "@/lib/wagmi";

const GIFT_PRESETS = [1, 5, 10, 25];

/**
 * Two-step gift: cUSD approve (when the existing allowance is too small) →
 * Penny.topUpFor(recipient, amount). The recipient address is validated with
 * viem.isAddress before we'll even attempt the write, so the only way to
 * misfire is a typo we couldn't catch (which the contract would still
 * accept — funds go to whatever address you typed).
 */
export function GiftCreditButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState<number>(5);


  const validRecipient = isAddress(recipient);
  const recipientLower = validRecipient ? (recipient.toLowerCase() as `0x${string}`) : undefined;
  const isSelf = recipientLower && address && recipientLower === address.toLowerCase();

  const wei = parseUnits(amount.toString(), 18);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, PENNY_ADDRESS] : undefined,
    query: { enabled: isConnected && isPennyDeployed && !!address },
  });

  const needsApprove = !allowance || (allowance as bigint) < wei;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  // Refetch allowance after any receipt confirms so the post-approve click
  // runs topUpFor instead of sending a second approve.
  useEffect(() => {
    if (confirmed && hash) {
      void refetchAllowance();
    }
  }, [confirmed, hash, refetchAllowance]);

  function submit() {
    if (!isConnected || !validRecipient || isSelf || amount <= 0) return;
    if (needsApprove) {
      writeContract({
        abi: erc20Abi,
        address: CUSD_ADDRESS,
        functionName: "approve",
        args: [PENNY_ADDRESS, wei],
      });
      return;
    }
    writeContract({
      abi: pennyAbi,
      address: PENNY_ADDRESS,
      functionName: "topUpFor",
      args: [recipient as `0x${string}`, wei],
    });
  }

  const reason = (() => {
    if (!isConnected) return "Connect a wallet to gift credit.";
    if (!isPennyDeployed) return "Penny contract not deployed yet.";
    if (!recipient.trim()) return "Enter the recipient's wallet address.";
    if (!validRecipient) return "That doesn't look like a valid address.";
    if (isSelf) return "Use Top up for yourself — gift is for someone else.";
    if (amount <= 0) return "Pick an amount.";
    return null;
  })();

  const cta = (() => {
    if (mining) return needsApprove ? "Approving…" : "Sending…";
    if (isPending) return "Waiting for wallet…";
    if (needsApprove) return `Approve $${amount} cUSD`;
    return `Gift $${amount} →`;
  })();

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Gift credit" />;
  }

  return (
    <div className="rounded-xl border border-stone-border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-midnight text-sm">Gift Penny credit</span>
        <span className="font-mono text-xs text-stone-text">topUpFor</span>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-widest text-stone-text block mb-1">
          Recipient
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          placeholder="0x…"
          className="w-full font-mono text-sm px-3 py-2 rounded-lg border border-stone-border bg-warm-stone text-midnight"
        />
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-widest text-stone-text block mb-1">
          Amount
        </label>
        <div className="flex gap-2 mb-2 flex-wrap">
          {GIFT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`px-3 py-1.5 min-h-[44px] rounded-full font-mono text-xs border transition-colors ${
                amount === p
                  ? "border-sky-blue text-sky-blue"
                  : "border-stone-border text-stone-text hover:text-midnight"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-text text-sm font-mono">
            $
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step="1"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="w-full pl-7 pr-3 py-2 rounded-lg border border-stone-border bg-warm-stone font-mono text-sm text-midnight"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!!reason || mining || isPending}
        className="w-full btn-pill-dark text-sm disabled:opacity-40"
      >
        {cta}
      </button>

      {reason && <p className="text-xs text-stone-text">{reason}</p>}
      {hash && (
        <div className="text-xs text-stone-text flex items-center justify-between">
          <a
            href={`https://celoscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-sky-blue underline"
          >
            view tx ↗ <span className="font-mono">({hash.slice(0, 10)}…)</span>
          </a>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
      )}
      {confirmed && (
        <p className="text-xs text-emerald-600">
          Gift confirmed. ${amount} credit lands in their Penny vault on next block.
        </p>
      )}
    </div>
  );
}
